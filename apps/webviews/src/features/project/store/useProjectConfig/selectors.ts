import type { HttpProjectConfig } from "@onapi/domain";
import type { VariableScopeDefinition } from "postman-collection";

type ProjectState = { http: HttpProjectConfig };
export const selectActiveEnvironment = ({ http }: ProjectState) =>
  http.environments.find((scope) => scope.id === http.activeEnvironment);

export function scopeValues(
  scope?: VariableScopeDefinition,
): Record<string, string> {
  return Object.fromEntries(
    (scope?.values || [])
      .filter((entry) => !entry.disabled)
      .map((entry) => [
        entry.key || "",
        typeof entry.value === "string"
          ? entry.value
          : entry.value == null
            ? ""
            : JSON.stringify(entry.value),
      ]),
  );
}
