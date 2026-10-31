import { variableValueText } from "./context";

/** Resolve configured values at execution time without changing the saved definition. */
export function resolveVariables<T>(
  value: T,
  variables: Record<string, unknown>,
): T {
  if (typeof value === "string") {
    return value.replace(/{{\s*([^{}]+?)\s*}}/g, (expression, key: string) =>
      Object.hasOwn(variables, key)
        ? variableValueText(variables[key])
        : expression,
    ) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveVariables(item, variables)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        resolveVariables(item, variables),
      ]),
    ) as T;
  }
  return value;
}
