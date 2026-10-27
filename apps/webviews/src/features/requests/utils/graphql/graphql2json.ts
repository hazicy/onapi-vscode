import { parse, Kind } from "graphql";
import type { DocumentNode, SelectionSetNode, ValueNode } from "graphql";
import type { QueryDocument, QueryField, QueryValue } from "./types";

export function graphql2json(queryString: string): QueryDocument {
  try {
    // Parse GraphQL query into AST
    const ast = parse(queryString);
    return processAST(ast);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("Unknown error parsing GraphQL query");
    }
  }
}

function processAST(ast: DocumentNode): QueryDocument {
  // Process root node
  const definition = ast.definitions[0];
  if (!definition || definition.kind !== Kind.OPERATION_DEFINITION) {
    throw new Error("Expected a GraphQL operation");
  }
  return {
    type: definition.kind,
    operation: definition.operation,
    name: definition.name?.value,
    children: processSelectionSet(definition.selectionSet),
  };
}

function processSelectionSet(
  selectionSet: SelectionSetNode | undefined,
): QueryField[] | null {
  if (!selectionSet) {
    return null;
  }

  return selectionSet.selections.map((selection) => {
    if (selection.kind !== Kind.FIELD) {
      throw new Error(
        "Schema editor supports field selections; use the raw editor for fragments",
      );
    }
    const node: QueryField = {
      type: selection.kind,
      name: selection.name.value,
    };

    // If there's a child selection set, recursively process it
    if (selection.selectionSet) {
      node.children = processSelectionSet(selection.selectionSet);
    }

    // Process arguments (if any)
    if (selection.arguments?.length) {
      node.arguments = selection.arguments.map((arg) => ({
        name: arg.name.value,
        value: processValue(arg.value),
      }));
    }

    // Process directives (if any)
    if (selection.directives?.length) {
      node.directives = selection.directives.map((directive) => ({
        name: directive.name.value,
        arguments: directive.arguments?.map((arg) => ({
          name: arg.name.value,
          value: processValue(arg.value),
        })),
      }));
    }

    return node;
  });
}

function processValue(value: ValueNode): QueryValue {
  switch (value.kind) {
    case "IntValue":
    case "FloatValue":
      return Number(value.value);
    case "StringValue":
    case "BooleanValue":
    case "EnumValue":
      return value.value;
    case "ListValue":
      return value.values.map(processValue);
    case "ObjectValue":
      return value.fields.reduce<{ [key: string]: QueryValue }>(
        (obj, field) => {
          obj[field.name.value] = processValue(field.value);
          return obj;
        },
        {},
      );
    case "Variable":
      return `$${value.name.value}`;
    default:
      return null;
  }
}
