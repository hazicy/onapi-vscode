import runtimeLanguage from "@onapi/http-model/locale/runtime";

export function resolveLanguage(value: string): "en" | "zh-cn" {
  const normalized = value.toLowerCase().replace(/_/g, "-");
  return ["cn", "zh", "zh-cn", "zh-hans", "zh-hans-cn", "zh-sg"].includes(
    normalized,
  )
    ? "zh-cn"
    : "en";
}

const buildLanguage =
  typeof __ONAPI_LANGUAGE__ === "undefined" ? "auto" : __ONAPI_LANGUAGE__;
export const language = resolveLanguage(
  buildLanguage === "auto" ? runtimeLanguage : buildLanguage,
);
