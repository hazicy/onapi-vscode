import type { HttpProjectConfig } from "../index";
import type { VariableDefinition } from "postman-collection";

export type VariableScope = "system" | "global" | "collection" | "environment";
export interface VariableEntry {
  name: string;
  value: unknown;
  scope: VariableScope;
  kind: "value" | "dynamic";
  type?: string;
  description?: VariableDefinition["description"];
}
export type VariableContext = Map<string, VariableEntry>;

/** Static configuration only. Runtime local/data scopes and scripts are resolved by Postman. */
export function createVariableContext(
  http: HttpProjectConfig,
  dynamicNames: readonly string[] = [],
  environmentId = http.activeEnvironment,
): VariableContext {
  const context: VariableContext = new Map(
    dynamicNames.map((name) => [
      name,
      {
        name,
        value: undefined,
        scope: "system",
        kind: "dynamic",
      },
    ]),
  );
  const scopes: [VariableScope, VariableDefinition[] | undefined][] = [
    ["global", http.options.globals.values],
    ["collection", http.collection.variable],
    [
      "environment",
      http.environments.find((scope) => scope.id === environmentId)?.values,
    ],
  ];
  for (const [scope, variables] of scopes) {
    for (const variable of variables || []) {
      if (!variable.key || variable.disabled) {
        continue;
      }
      context.set(variable.key, {
        name: variable.key,
        value: variable.value,
        scope,
        kind: "value",
        type: variable.type,
        description: variable.description,
      });
    }
  }
  const priority: Record<VariableScope, number> = {
    environment: 0,
    collection: 1,
    global: 2,
    system: 3,
  };
  return new Map(
    [...context].sort(([, a], [, b]) => priority[a.scope] - priority[b.scope]),
  );
}

export function configuredVariableValues(
  context: VariableContext,
): Record<string, unknown> {
  return Object.fromEntries(
    [...context.values()]
      .filter((entry) => entry.kind === "value")
      .map((entry) => [entry.name, entry.value]),
  );
}

export function variableValueText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return typeof value === "string" ? value : (JSON.stringify(value) ?? "");
}
