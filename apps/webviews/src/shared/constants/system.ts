import i18next from "i18next";

// Built-in values; random data generators are available through Faker.js.
export const SYSTEM_VARS: Record<string, string> = {
  timestamp: i18next.t("sys_var.timestamp"),
  microTimestamp: i18next.t("sys_var.microTimestamp"),
  randomInt: i18next.t("sys_var.randomInt"),
  randomFloat: i18next.t("sys_var.randomFloat"),
  guid: i18next.t("sys_var.guid"),
  key: i18next.t("sys_var.key"),
  item: i18next.t("sys_var.item"),
  iterationData: i18next.t("sys_var.iterationData"),
};
