import { mockExp } from "@onapi/domain/mock/expressions";
import {
  configuredVariableValues,
  variableValueText,
  type VariableContext,
} from "@onapi/domain/variables/context";
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
  context: VariableContext;
  emptyTip: string;
  dynamicTip: string;
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
    context,
    functions,
    functionSources,
    language,
  } = input;
  if (usesPlainPreview(input) && option !== VAR_OPTIONS_KEY.var) {
    return value;
  }
  const variable = context.get(value);
  if (option === VAR_OPTIONS_KEY.var && variable?.kind === "dynamic") {
    return input.dynamicTip;
  }
  if (usesPlainPreview(input)) {
    if (!variable) {
      return input.undefinedTip;
    }
    const text = variableValueText(variable.value);
    return text === "" ? input.emptyTip : text;
  }
  const variables = configuredVariableValues(context);
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
