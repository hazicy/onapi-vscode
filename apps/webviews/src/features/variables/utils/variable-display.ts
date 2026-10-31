import type { TFunction } from "i18next";
import type { HttpProjectConfig } from "@onapi/domain";
import {
  createVariableContext,
  variableValueText,
  type VariableContext,
  type VariableEntry,
} from "@onapi/domain/variables/context";
import { SYSTEM_VARS } from "@/shared/constants/system";

export function variableContext(
  http: HttpProjectConfig,
  environmentId?: string,
) {
  return createVariableContext(
    {
      globals: http.options.globals.values,
      collection: http.collection.variable,
      environment: http.environments.find(
        (env) => env.id === (environmentId ?? http.activeEnvironment),
      )?.values,
    },
    Object.keys(SYSTEM_VARS).map((name) => `$${name}`),
  );
}

export function variableDisplay(name: string, context: VariableContext) {
  return context.get(name) ?? { kind: "undefined" as const };
}

export function variableDisplayText(
  variable: VariableEntry | { kind: "undefined" },
  t: TFunction,
) {
  switch (variable.kind) {
    case "undefined":
      return t("interaction.variableUndefined");
    case "dynamic":
      return t("interaction.variableDynamic");
    case "value": {
      const value = variableValueText(variable.value);
      return value === "" ? t("interaction.variableEmpty") : value;
    }
  }
}

export function variableScopeLabel(
  scope: VariableEntry["scope"],
  t: TFunction,
) {
  const labels = {
    environment: "supplement.var_env",
    collection: "interaction.collectionScope",
    global: "supplement.var_glo",
    system: "interaction.systemScope",
  } as const;
  return t(labels[scope]);
}
