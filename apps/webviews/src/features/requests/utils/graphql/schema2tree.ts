import type {
  SchemaTypeRef,
  SchemaType,
  OrganizedSchema,
  SchemaTreeNode,
  TreeArgument,
  InputField,
} from "./types";
import { cloneDeep, has, isEqual, map, union } from "lodash-es";

function getQueryTypeInfo(typeObj: SchemaTypeRef): {
  kind: string;
  itemKind: string;
} {
  // If no ofType, return current type info directly
  if (!typeObj.ofType) {
    if (!typeObj.name) {
      throw new Error("GraphQL named type is missing its name");
    }
    return {
      kind: typeObj.kind.toLowerCase(),
      itemKind: typeObj.name,
    };
  }

  // If LIST type, recursively process and return array type
  if (typeObj.kind === "LIST") {
    const innerType = getQueryTypeInfo(typeObj.ofType);
    return {
      kind: "array",
      itemKind: innerType.itemKind,
    };
  }

  // Continue recursively processing other types
  return getQueryTypeInfo(typeObj.ofType);
}

function transformQuery(queryData: SchemaType, ids: string[]) {
  ids.push("Query");
  const result: {
    Query: SchemaTreeNode & { children: SchemaTreeNode[]; key: string };
  } = {
    Query: {
      name: queryData.name,
      kind: queryData.kind.toLowerCase(),
      path: "Query",
      key: "Query",
      children: [],
      checkable: false,
    },
  };

  if (queryData.fields) {
    result.Query.children = queryData.fields.map((field) => {
      const typeInfo = getQueryTypeInfo(field.type);
      ids.push(`${result.Query.key}.${field.name}`);
      return {
        key: `${result.Query.key}.${field.name}`,
        name: field.name,
        ...typeInfo,
        path: `${result.Query.key}.${field.name}`,
        args: field?.args,
      };
    });
  }

  return result;
}

export const getChildTree = (
  field: SchemaTreeNode,
  raw: Partial<OrganizedSchema>,
) => {
  const objects = transformStructure({ objects: raw.objects });
  if (isEqual(field?.key, "Query")) {
    return field?.children;
  }
  if (objects.objects[field.itemKind || ""]) {
    const obj = cloneDeep(objects.objects[field.itemKind || ""]);
    const modifyPaths = objects.objectPaths.filter((path) =>
      path.startsWith(`${field.itemKind}.`),
    );
    if (modifyPaths.length) {
      for (const modifyPath of modifyPaths) {
        const newPath = modifyPath.replace(`${field.itemKind}.`, "");
        updateObjectByPath(obj, newPath, {
          key: `${field.key}.${newPath}`,
          path: `${field.key}.${newPath}`,
        });
      }
    }

    return map(obj.children, (item) => {
      return {
        ...item,
        ...(!!item.itemKind && has(objects.objects, item.itemKind)
          ? { children: [] }
          : { isLeaf: true }),
      };
    });
  }
};

export const raw2tree = (raw: Partial<OrganizedSchema>) => {
  const objects = transformStructure({ objects: raw.objects });
  const inputObjects = transformInputObjects(raw.inputObjects);
  const tree: { Query?: SchemaTreeNode } = {};
  const ids: string[] = [];
  if (raw.queries?.fields) {
    const queryInfo = transformQuery(raw.queries, ids);
    for (let i = 0; i < queryInfo.Query.children.length; i++) {
      const field = queryInfo.Query.children[i];
      if (objects.objects[field.itemKind || ""]) {
        const obj = cloneDeep(objects.objects[field.itemKind || ""]);
        const modifyPaths = objects.objectPaths.filter((path) =>
          path.startsWith(`${field.itemKind}.`),
        );
        if (modifyPaths.length) {
          for (const modifyPath of modifyPaths) {
            const newPath = modifyPath.replace(`${field.itemKind}.`, "");
            updateObjectByPath(obj, newPath, {
              key: `${field.key}.${newPath}`,
              path: `${field.key}.${newPath}`,
            });
            ids.push(`${field.key}.${newPath}`);
          }
        }
        queryInfo.Query.children[i].children = [];
      }
      if (field.args && Array.isArray(field.args)) {
        const args: TreeArgument[] = [];
        for (const arg of field.args) {
          if (arg?.type?.name) {
            // List style
            const inputObject = inputObjects.inputObjects[arg.type.name];
            if (inputObject) {
              args.push({
                name: arg.name,
                description: arg.description,
                defaultValue: arg.defaultValue,
                itemKind: arg.type.name,
                inputObjects: inputObject,
              });
            } else {
              args.push({
                name: arg.name,
                description: arg.description,
                defaultValue: arg.defaultValue,
                itemKind: arg.type.name,
                inputObjects: [],
              });
            }
          } else if (arg?.type?.ofType) {
            // Single object style
            args.push({
              name: arg.name,
              description: arg.description,
              defaultValue: arg.defaultValue,
              itemKind: arg.type.ofType.name,
            });
          }
        }
        queryInfo.Query.children[i].args = args;
      }
      //delete queryInfo.Query.children[i].args;
    }
    tree.Query = queryInfo.Query;
  }
  return {
    tree,
    ids: union(ids),
  };
};

function getTypeInfo(
  typeObj: SchemaTypeRef,
  objects: Record<string, SchemaType>,
  processedTypes = new Set<string>(),
): Pick<
  SchemaTreeNode,
  "kind" | "itemKind" | "non_null" | "description" | "defaultValue"
> {
  if (typeObj.ofType) {
    const inner = getTypeInfo(typeObj.ofType, objects, processedTypes);
    return {
      ...inner,
      kind: typeObj.kind === "LIST" ? "array" : inner.kind,
      non_null: typeObj.kind === "NON_NULL" || inner.non_null,
    };
  }
  return {
    kind: typeObj.kind.toLowerCase(),
    itemKind: typeObj.name || undefined,
    non_null: false,
  };
}

function transformObject(
  objData: SchemaType,
  objects: Record<string, SchemaType>,
  processedTypes = new Set<string>(),
): SchemaTreeNode | null {
  // If this object has been processed, return null to avoid circular references
  if (processedTypes.has(objData.name)) {
    return null;
  }

  // Mark current object as processed
  processedTypes.add(objData.name);

  const objResult: SchemaTreeNode = {
    name: objData.name,
    kind: objData.kind.toLowerCase(),
    description: objData.description || null,
    children: [],
  };

  if (objData.fields) {
    objResult.children = objData.fields.map((field) => {
      const typeInfo = getTypeInfo(field.type, objects, processedTypes);
      const result: SchemaTreeNode = {
        name: field.name,
        ...typeInfo,
        description: field.description || null,
      };

      // If it's an object type and not processed, add its children
      if (typeInfo.itemKind && objects[typeInfo.itemKind]) {
        const transformedObject = transformObject(
          { ...objects[typeInfo.itemKind], name: typeInfo.itemKind },
          objects,
          new Set(processedTypes), // Create a new Set to avoid affecting other branches
        );
        if (transformedObject) {
          result.children = transformedObject.children;
        }
      }

      return result;
    });
  }

  return objResult;
}

function collectPaths(objects: Record<string, SchemaTreeNode>): string[] {
  const paths: string[] = [];
  const visit = (nodes: SchemaTreeNode[], prefix: string) => {
    for (const node of nodes) {
      const current = `${prefix}.${node.name}`;
      paths.push(current);
      if (node.children) {
        visit(node.children, current);
      }
    }
  };
  for (const [name, node] of Object.entries(objects)) {
    paths.push(name);
    if (node.children) {
      visit(node.children, name);
    }
  }
  return paths;
}

export function getObjectByPath(
  obj: SchemaTreeNode,
  path: string,
): SchemaTreeNode | undefined {
  let current: SchemaTreeNode | undefined = obj;
  for (const part of path.split(".")) {
    current = current?.children?.find((child) => child.name === part);
    if (!current) {
      return undefined;
    }
  }
  return current;
}

export function updateObjectByPath(
  obj: SchemaTreeNode,
  path: string,
  updates: Partial<SchemaTreeNode>,
): boolean {
  const target = getObjectByPath(obj, path);
  if (!target) {
    return false;
  }
  const { name, ...rest } = updates;
  Object.assign(target, rest);
  return true;
}

export function transformStructure(data: {
  objects?: Record<string, SchemaType>;
}) {
  const result: {
    objects: Record<string, SchemaTreeNode>;
    objectPaths: string[];
  } = { objects: {}, objectPaths: [] };
  const processedTypes = new Set<string>();

  Object.entries(data.objects || {}).forEach(([objName, objData]) => {
    if (!processedTypes.has(objName)) {
      const transformed = transformObject(
        { ...objData, name: objName },
        data.objects || {},
        processedTypes,
      );
      if (transformed) {
        result.objects[objName] = transformed;
      }
    }
  });

  result.objectPaths = collectPaths(result.objects);

  return result;
}

function transformInputObjects(inputObjects: Record<string, SchemaType> = {}): {
  inputObjects: Record<string, InputField[]>;
} {
  const transformed: { inputObjects: Record<string, InputField[]> } = {
    inputObjects: {},
  };

  for (const key in inputObjects) {
    if (inputObjects[key].inputFields) {
      transformed.inputObjects[key] = [];
      for (const field of inputObjects[key].inputFields) {
        const transformedField: InputField = {
          name: field.name,
          description: field.description,
          defaultValue: field.defaultValue,
          operations: [],
        };

        const fieldType = getQueryTypeInfo(field.type);
        if (inputObjects[fieldType.itemKind]) {
          for (const operation of inputObjects[fieldType.itemKind]
            .inputFields || []) {
            transformedField.operations.push({
              name: operation.name,
              description: operation.description,
              defaultValue: operation.defaultValue,
              type: getQueryTypeInfo(operation.type).itemKind,
            });
          }
        }

        transformed.inputObjects[key].push(transformedField);
      }
    }
  }

  return transformed;
}
