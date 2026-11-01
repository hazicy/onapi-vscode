import { has } from "lodash-es";

type VariableMap = Record<string, string | undefined>;

export const resolveOAuth2Variables = (
  value = "",
  variables: VariableMap,
): Promise<string> =>
  new Promise((resolve, reject) => {
    const pattern = /\{\{(?![$!])[^{}]+\}\}/g;
    const missing = value
      .match(pattern)
      ?.find((match) => !has(variables, match.slice(2, -2)));
    if (missing) {
      reject(missing.slice(2, -2));
      return;
    }
    resolve(
      value.replace(pattern, (match) => String(variables[match.slice(2, -2)])),
    );
  });

export const resolveOAuth2Parameters = async <
  T extends { key: string; value: string },
>(
  parameters: T[],
  variables: VariableMap,
): Promise<T[]> => {
  const result: T[] = [];
  for (const item of parameters) {
    if (!item?.key) {
      continue;
    }
    const key = await resolveOAuth2Variables(item.key, variables);
    const value = await resolveOAuth2Variables(item.value, variables);
    if (key) {
      result.push({ ...item, key, value });
    }
  }
  return result;
};
