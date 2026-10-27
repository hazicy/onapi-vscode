import {
  ASSIGNMENT_VALUE_KEY,
  FAKERJS_FORMAT_LIST,
  VAR_OPTIONS_KEY,
} from "@/features/variables/constants/variable";
import { encryptString } from "@onapi/domain/mock/expressions";
import { transFuncName, transKey } from "@/features/variables/utils/variable";
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
    .flatMap((item) => {
      // Preserve the existing omission of empty/false/zero Faker arguments.
      if (!item.value) {
        return [];
      }
      const value = Array.isArray(item.value)
        ? `[${item.value.join(",")}]`
        : String(item.value);
      return [`${transKey(item.key)}=${encryptString(value)}`];
    })
    .join(",");
  const format = hasDateFormat(option, value)
    ? `|format(${dateFormat.format},${dateFormat.utc})`
    : "";
  let source = value;
  if (option === VAR_OPTIONS_KEY.fixed || option === VAR_OPTIONS_KEY.ai_value) {
    source =
      option === VAR_OPTIONS_KEY.ai_value &&
      value === ASSIGNMENT_VALUE_KEY.random
        ? "@ai()"
        : `'${value}'`;
  } else if (option === VAR_OPTIONS_KEY.mock) {
    source = `$fakerjs.${value}${fakerParameters ? `(${fakerParameters})` : ""}`;
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
