import {
  FAKERJS_FORMAT_LIST,
  VAR_OPTIONS_KEY,
} from "@/features/variables/constants/variable";
import {
  liquidLiteral,
  transFuncName,
  transKey,
} from "@/features/variables/utils/variable";
import type { VariableDraft } from "./variable-draft";

export const isDescriptionOption = (option: VAR_OPTIONS_KEY) =>
  option === VAR_OPTIONS_KEY.desc || option === VAR_OPTIONS_KEY.ai_desc;

export const hasDateFormat = (option: VAR_OPTIONS_KEY, value: string) =>
  option === VAR_OPTIONS_KEY.mock &&
  FAKERJS_FORMAT_LIST.includes(value.toLowerCase());

export function buildVariableExpression(
  option: VAR_OPTIONS_KEY,
  draft: VariableDraft,
): string {
  const { value, functions, parameters, dateFormat } = draft;
  const fakerParameters = parameters
    .filter((item) => item.value !== undefined && item.value !== "")
    .map((item) => `${transKey(item.key)}: ${liquidLiteral(item.value)}`)
    .join(", ");
  const format = hasDateFormat(option, value)
    ? `|format: ${liquidLiteral(dateFormat.format)}, ${liquidLiteral(dateFormat.utc)}`
    : "";
  let source = value;
  if (option === VAR_OPTIONS_KEY.fixed || option === VAR_OPTIONS_KEY.ai_value) {
    source = liquidLiteral(value);
  } else if (option === VAR_OPTIONS_KEY.mock) {
    source = `${liquidLiteral(value)}|faker${fakerParameters ? `: ${fakerParameters}` : ""}`;
  }
  const pipeline = functions
    .map((fn) => transFuncName(fn.func_name, fn.paras))
    .join("|");
  return `{{${source}${format}${pipeline ? `|${pipeline}` : ""}}}`;
}

export const getInsertionValue = (
  option: VAR_OPTIONS_KEY,
  value: string,
  expression: string,
) => (isDescriptionOption(option) ? value : expression);
