import { Liquid } from "liquidjs";
import { registerMockFilters } from "./filters";
import { createFakerFilter } from "./faker";

export type CustomFunctions = Record<string, unknown>;

/** One evaluator per call keeps custom functions and locale selection isolated. */
export function mockExp(
  value: string,
  variables: Record<string, unknown> = {},
  language = "en",
  customFunctions: CustomFunctions = {},
): unknown {
  if (!value.startsWith("{{") || !value.endsWith("}}")) {
    return value;
  }
  const engine = new Liquid({
    strictVariables: true,
    strictFilters: true,
    ownPropertyOnly: true,
  });
  registerMockFilters(engine);
  engine.registerFilter("faker", createFakerFilter(language));
  try {
    for (const [name, source] of Object.entries(customFunctions)) {
      if (/^fn_\w+$/.test(name) && typeof source === "string") {
        engine.registerFilter(
          name,
          new Function("text", source) as (text: unknown) => unknown,
        );
      }
    }
    return engine.evalValueSync(value.slice(2, -2).trim(), variables);
  } catch {
    // Keep unresolved input editable and avoid corrupting request content.
    return value;
  }
}

export default mockExp;
