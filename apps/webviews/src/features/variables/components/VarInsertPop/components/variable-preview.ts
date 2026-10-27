import { mapKeys, merge } from "lodash-es";
import { mockExp } from "@onapi/domain/mock/expressions";
import { SYSTEM_VARS } from "@/shared/constants/system";
import { getGlobals } from "@/features/requests/utils/send-utils";
import {
  ASSIGNMENT_VALUE_KEY,
  VAR_OPTIONS_KEY,
} from "@/features/variables/constants/variable";
import type { FuncListRenderItem } from "@onapi/domain/requests/types/variable";

export interface PreviewInput {
  option: VAR_OPTIONS_KEY;
  value: string;
  expression: string;
  functions: FuncListRenderItem[];
  environment: Record<string, unknown>;
  functionSources: Record<string, string>;
  language: string;
  undefinedTip: string;
}

export function usesPlainPreview({
  option,
  value,
  functions,
}: Pick<PreviewInput, "option" | "value" | "functions">) {
  return (
    ((option === VAR_OPTIONS_KEY.var || option === VAR_OPTIONS_KEY.fixed) &&
      (!value || !functions.length)) ||
    (option === VAR_OPTIONS_KEY.ai_value &&
      value !== ASSIGNMENT_VALUE_KEY.random &&
      !functions.length)
  );
}

export async function evaluateVariablePreview(
  input: PreviewInput,
): Promise<string> {
  const {
    option,
    value,
    expression,
    environment,
    functions,
    functionSources,
    language,
  } = input;
  if (usesPlainPreview(input) && option !== VAR_OPTIONS_KEY.var) {
    return value;
  }
  // Scope precedence is system < globals < active environment. Use a fresh object.
  const variables: Record<string, unknown> = merge(
    {},
    mapKeys(SYSTEM_VARS, (_value, key) => `$${key}`),
    await getGlobals(),
    environment,
  );
  if (usesPlainPreview(input)) {
    const resolved = variables[value];
    return typeof resolved === "string"
      ? resolved || input.undefinedTip
      : JSON.stringify(resolved) || "";
  }
  const scripts = Object.fromEntries(
    functions
      .filter(
        (fn) =>
          fn.func_name.startsWith("fn_") && fn.func_name in functionSources,
      )
      .map((fn) => [fn.func_name, functionSources[fn.func_name]]),
  );
  const result = await mockExp(expression, variables, language, scripts);
  return typeof result === "string"
    ? result
    : typeof result === "object" && result !== null
      ? JSON.stringify(result) || ""
      : String(result);
}
