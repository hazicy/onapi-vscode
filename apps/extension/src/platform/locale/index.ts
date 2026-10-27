import i18n from "i18next";
import { env } from "vscode";
import en from "@onapi/domain/locale/en_US.json";
import cn from "@onapi/domain/locale/zh_CN.json";
import { resolveLanguage } from "@onapi/domain/locale/language";
const selected =
  typeof __ONAPI_LANGUAGE__ === "undefined" ? "auto" : __ONAPI_LANGUAGE__;
export const language = resolveLanguage(
  selected === "auto" ? env?.language || "en" : selected,
);
i18n.init({
  resources: { en: { translation: en }, "zh-cn": { translation: cn } },
  initAsync: false,
  lowerCaseLng: true,
  fallbackLng: "en",
  lng: language,
  interpolation: { escapeValue: false },
});
export default i18n;
