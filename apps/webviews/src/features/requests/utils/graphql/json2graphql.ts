import { Kind, print, OperationTypeNode, parseType } from "graphql";
import type {
  DocumentNode,
  OperationDefinitionNode,
  NameNode,
  VariableDefinitionNode,
  TypeNode,
  SelectionSetNode,
  FieldNode,
  ArgumentNode,
  DirectiveNode,
  ValueNode,
} from "graphql";
import type {
  QueryDocument,
  QueryField,
  QueryArgument,
  QueryDirective,
  QueryValue,
} from "./types";

export function json2graphql(tree: QueryDocument) {
  // Create AST node
  const ast: DocumentNode = {
    kind: Kind.DOCUMENT,
    definitions: [createOperationDefinition(tree)],
  };
  // Use graphql-js print function to convert AST to string
  return print(ast);
}

export function createOperationDefinition(
  tree: QueryDocument,
): OperationDefinitionNode {
  return {
    kind: Kind.OPERATION_DEFINITION,
    operation: tree.operation || OperationTypeNode.QUERY,
    name: tree.name ? createName(tree.name) : undefined,
    variableDefinitions: createVariableDefinitions(tree.variables),
    directives: [],
    selectionSet: createSelectionSet(tree.children || tree.fields),
  };
}

function createName(name: string): NameNode {
  return {
    kind: Kind.NAME,
    value: name,
  };
}

function createVariableDefinitions(
  variables: QueryDocument["variables"],
): VariableDefinitionNode[] {
  if (!variables || !variables.length) {
    return [];
  }

  return variables.map((variable) => ({
    kind: Kind.VARIABLE_DEFINITION,
    variable: {
      kind: Kind.VARIABLE,
      name: createName(variable.name),
    },
    type: createType(variable.type, variable.required),
    defaultValue: undefined,
    directives: [],
  }));
}

function createType(type: string, required?: boolean): TypeNode {
  const namedType = parseType(type);

  if (required && namedType.kind !== Kind.NON_NULL_TYPE) {
    return {
      kind: Kind.NON_NULL_TYPE,
      type: namedType,
    };
  }

  return namedType;
}

function createSelectionSet(
  fields: QueryField[] | null | undefined,
): SelectionSetNode {
  if (!fields || !fields.length) {
    return {
      kind: Kind.SELECTION_SET,
      selections: [],
    };
  }

  return {
    kind: Kind.SELECTION_SET,
    selections: fields.map(createField),
  };
}

function createField(field: QueryField): FieldNode {
  return {
    kind: Kind.FIELD,
    name: createName(field.name),
    arguments: createArguments(field.arguments),
    directives: createDirectives(field.directives),
    selectionSet:
      field.children?.length || field.fields?.length
        ? createSelectionSet(field.children || field.fields)
        : undefined,
  };
}

export function createArguments(
  args: QueryArgument[] | undefined,
): ArgumentNode[] {
  if (!args || !args.length) {
    return [];
  }

  return args.map((arg) => ({
    kind: Kind.ARGUMENT,
    name: createName(arg.name),
    value: createValue(arg.value),
  }));
}

function createDirectives(
  directives: QueryDirective[] | undefined,
): DirectiveNode[] {
  if (!directives || !directives.length) {
    return [];
  }

  return directives.map((directive) => ({
    kind: Kind.DIRECTIVE,
    name: createName(directive.name),
    arguments: createArguments(directive.arguments),
  }));
}

function createValue(value: QueryValue): ValueNode {
  if (value === null || value === undefined) {
    return { kind: Kind.NULL };
  }

  if (typeof value === "string") {
    if (value.startsWith("$")) {
      return {
        kind: Kind.VARIABLE,
        name: createName(value.substring(1)),
      };
    }
    return {
      kind: Kind.STRING,
      value: value,
    };
  }

  if (typeof value === "number") {
    return {
      kind: Number.isInteger(value) ? Kind.INT : Kind.FLOAT,
      value: String(value),
    };
  }

  if (typeof value === "boolean") {
    return {
      kind: Kind.BOOLEAN,
      value: value,
    };
  }

  if (Array.isArray(value)) {
    return {
      kind: Kind.LIST,
      values: value.map(createValue),
    };
  }

  if (typeof value === "object") {
    return {
      kind: Kind.OBJECT,
      fields: Object.entries(value).map(([key, val]) => ({
        kind: Kind.OBJECT_FIELD,
        name: createName(key),
        value: createValue(val),
      })),
    };
  }

  return { kind: Kind.NULL };
}
