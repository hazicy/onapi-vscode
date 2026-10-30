import { get, set } from "lodash";
import JSON5 from "json5";
import definitions from "./faker-definitions.json";
import { faker, fakerZH_CN } from "./locales";
import { generateBankCard, generateIdCard } from "./cards";

type Parameter = { type: string; default?: unknown; isrealKey?: boolean };

function convert(value: unknown, parameter: Parameter): unknown {
  switch (parameter.type) {
    case "string":
      return String(value);
    case "integer":
    case "float":
    case "number":
      return Number(value);
    case "bigint":
      return BigInt(String(value).replace(/n$/, ""));
    case "boolean":
      return value === true || value === "true";
    case "regexp":
      return new RegExp(String(value).replace(/^\/|\/$/g, ""));
    case "array":
    case "object":
    case "coordinate":
    case "enum":
    case "enums":
      return typeof value === "string" ? JSON5.parse(value) : value;
    default:
      return value;
  }
}

/** Native Liquid: {{ 'number.int' | faker: min: 7, max: 7 }}. */
export function createFakerFilter(language: string) {
  const instance = /^(zh-cn|zh-hans)$/i.test(language) ? fakerZH_CN : faker;
  return (path: string, ...arguments_: Array<[string, unknown]>): unknown => {
    const definition = definitions.find(
      (item) =>
        `${item.module}.${item.function}`.toLowerCase() ===
        String(path).toLowerCase(),
    );
    if (!definition) {
      throw new Error(`Unknown Faker generator: ${path}`);
    }
    const options: Record<string, unknown> = {};
    const positional = new Map<string, unknown>();
    const parameters = definition.params as Record<string, Parameter>;
    for (const argument of arguments_) {
      if (!Array.isArray(argument) || argument.length !== 2) {
        throw new Error("Faker expects named arguments");
      }
      const [key, value] = argument;
      const parameterKey = Object.keys(parameters).find(
        (name) => name === key || name.endsWith(`.${key}`),
      );
      if (!parameterKey) {
        throw new Error(`Unknown Faker argument: ${key}`);
      }
      const parameter = parameters[parameterKey];
      const converted = convert(value, parameter);
      if (parameter.isrealKey) {
        set(options, parameterKey, converted);
      } else {
        positional.set(parameterKey, converted);
      }
    }
    if (definition.function === "idcard") {
      return generateIdCard(options);
    }
    if (definition.function === "bankcard") {
      return generateBankCard(options);
    }
    const suffix = "suffix" in definition ? definition.suffix : undefined;
    const method = suffix
      ? definition.function.slice(0, -suffix.length)
      : definition.function;
    const module = get(instance, definition.module.toLowerCase());
    const generator = get(module, method);
    if (typeof generator !== "function") {
      throw new Error(`Unavailable Faker generator: ${path}`);
    }
    // Catalog order defines positional arguments; all option fields share one slot.
    // Some Faker APIs take options after a positional array rather than first.
    const args: unknown[] = [];
    let optionsAdded = false;
    for (const [key, parameter] of Object.entries(parameters)) {
      if (parameter.isrealKey) {
        if (!optionsAdded) {
          args.push(Object.keys(options).length ? options : undefined);
          optionsAdded = true;
        }
      } else {
        args.push(positional.get(key));
      }
    }
    while (args.length && args[args.length - 1] === undefined) {
      args.pop();
    }
    const result = generator.apply(module, args);
    return suffix ? get(result, suffix) : result;
  };
}
