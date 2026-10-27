import { define, generate, type JsonSchema } from "json-schema-faker";
import { minimatch } from "minimatch";
import RefParser from "@apidevtools/json-schema-ref-parser";
import { mockExp } from "@onapi/domain/mock/expressions";
import { faker } from "@faker-js/faker/locale/en";

type Schema = Record<string, any>;
export type MockRule = {
  type: string;
  match_type?: string;
  match_case?: number;
  match_rule?: string;
  mock_type?: number;
  mock?: string;
};
type MockSpec = {
  expression?: unknown;
  language: string;
  nullable?: boolean;
};

define("onapi-mock", async (value, schema, context) => {
  const spec = value as MockSpec;
  if (spec.nullable && context.random.bool()) {
    return null;
  }
  if (spec.expression !== undefined) {
    const result = mockExp(String(spec.expression), {}, spec.language);
    switch (schema.type) {
      case "integer":
      case "number":
        return Number(result);
      case "boolean":
        return result === true || result === "true" || result === 1;
      case "string":
        return String(result);
      default:
        return result;
    }
  }
  const plain = { ...schema };
  delete plain["x-onapi-mock"];
  return context.proceed!(plain);
});

function prepare(
  schema: unknown,
  rules: MockRule[],
  language: string,
  key = "",
): JsonSchema {
  if (typeof schema === "boolean") {
    return schema;
  }
  if (!schema || typeof schema !== "object") {
    return {};
  }
  const node: Schema = { ...(schema as Schema) };
  if (Array.isArray(node.type)) {
    node.type = node.type[0];
  }
  // The editor supports legacy drafts; normalize their boolean exclusive bounds.
  if (typeof node.exclusiveMinimum === "boolean") {
    if (node.exclusiveMinimum && typeof node.minimum === "number") {
      node.exclusiveMinimum = node.minimum;
    } else {
      delete node.exclusiveMinimum;
    }
  }
  if (typeof node.exclusiveMaximum === "boolean") {
    if (node.exclusiveMaximum && typeof node.maximum === "number") {
      node.exclusiveMaximum = node.maximum;
    } else {
      delete node.exclusiveMaximum;
    }
  }
  delete node.$schema;
  // Legacy required=true on a field isn't the JSON Schema required array.
  if (typeof node.required === "boolean") {
    delete node.required;
  }
  for (const mapKey of [
    "properties",
    "patternProperties",
    "definitions",
    "$defs",
    "dependentSchemas",
  ]) {
    if (node[mapKey] && typeof node[mapKey] === "object") {
      node[mapKey] = Object.fromEntries(
        Object.entries(node[mapKey]).map(([name, child]) => [
          name,
          prepare(child, rules, language, name),
        ]),
      );
    }
  }
  for (const childKey of [
    "items",
    "additionalProperties",
    "contains",
    "not",
    "if",
    "then",
    "else",
  ]) {
    if (node[childKey] !== undefined) {
      node[childKey] = Array.isArray(node[childKey])
        ? node[childKey].map((child: unknown) =>
            prepare(child, rules, language, key),
          )
        : prepare(node[childKey], rules, language, key);
    }
  }
  for (const listKey of ["oneOf", "anyOf", "allOf", "prefixItems"]) {
    if (Array.isArray(node[listKey])) {
      node[listKey] = node[listKey].map((child: unknown) =>
        prepare(child, rules, language, key),
      );
    }
  }
  const mock = node.mockField || node.mock?.mock;
  // Preserve legacy precedence: default/example (unless format/mock), enum, format, field mock, project rules.
  const hasValue =
    !node.format &&
    !mock &&
    (node.default !== undefined || node.example !== undefined);
  if (hasValue) {
    const value = node.default !== undefined ? node.default : node.example;
    node.const =
      node.type === "string"
        ? String(value)
        : node.type === "number" || node.type === "integer"
          ? Number(value)
          : node.type === "boolean"
            ? Boolean(value)
            : value;
  }
  if (
    !hasValue &&
    !Array.isArray(node.enum) &&
    !(node.type === "string" && node.format)
  ) {
    const rule = rules.find((rule) => {
      if (rule.type !== node.type) {
        return false;
      }
      const name = rule.match_case === 1 ? key : key.toLowerCase();
      const pattern =
        rule.match_case === 1
          ? String(rule.match_rule)
          : String(rule.match_rule).toLowerCase();
      return rule.match_type === "exact"
        ? name === pattern
        : minimatch(name, pattern);
    });
    const expression =
      mock ||
      (rule && (rule.mock_type === 1 || rule.mock_type === 2)
        ? rule.mock
        : undefined);
    if (expression !== undefined || node.apipiost_allow_null) {
      node["x-onapi-mock"] = {
        expression,
        language,
        nullable: !!node.apipiost_allow_null,
      } satisfies MockSpec;
    }
  }
  // String dates in the old generator used these aliases.
  if (node.format === "ip-address") {
    node.format = "ipv4";
  }
  if (node.format === "host-name") {
    node.format = "hostname";
  }
  if (node.apipiost_allow_null) {
    node["x-onapi-mock"] = {
      ...node["x-onapi-mock"],
      language,
      nullable: true,
    };
  }
  return node as JsonSchema;
}

export default class MockSchema {
  private readonly language: string;
  constructor(options: { lang?: string; app?: string } = {}) {
    this.language = options.lang || "en";
  }
  async mock(schema: unknown, rules: MockRule[] = []): Promise<any> {
    const resolved =
      schema && typeof schema === "object"
        ? await RefParser.dereference(structuredClone(schema) as any, {
            dereference: { circular: false },
          })
        : schema;
    return generate(prepare(resolved, rules, this.language), {
      alwaysFakeOptionals: true,
      useDefaultValue: false,
      useExamplesValue: false,
      maxDepth: 12,
      maxDefaultItems: 1,
      formats: {
        phone: () => faker.phone.number({ style: "international" }),
        color: () => faker.color.rgb({ casing: "upper" }),
        alpha: () => faker.word.sample(),
        alphanumeric: () => faker.string.alphanumeric(10),
      },
    });
  }
}
