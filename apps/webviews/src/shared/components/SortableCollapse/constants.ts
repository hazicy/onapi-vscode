import i18next from "i18next";

export const TAG_TYPE_MAP = {
  api: {
    name: "API",
    color: "#FA7600",
  },
  case: {
    name: i18next.t("supplement.tt_case"),
    color: "#3B75FF",
  },
  sample: {
    name: "API",
    color: "#FA7600",
  },
  if: {
    name: "IF",
    color: "#3B75FF",
  },
  for: {
    name: i18next.t("supplement.loop"),
    color: "#FA7600",
  },
  forEach: {
    name: "ForEach",
    color: "#698296",
  },
  loop: {
    name: i18next.t("supplement.loop"),
    color: "#8D56FF",
  },
  wait: {
    name: i18next.t("common.wait.tag"),
    color: "#FFC01E",
  },
  script: {
    name: i18next.t("common.script.tag"),
    color: "#26CEA4",
  },
  assert: {
    name: i18next.t("common.assertion.tag"),
    color: "#FF583E",
  },
  begin: {
    name: i18next.t("test.steps_page.add_steps_detail.event_tag"),
    color: "#4ADEFF",
  },
  mock_if: {
    name: "if",
    color: "#3B75FF",
  },
  elseif: {
    name: "else if",
    color: "#8D56FF",
  },
  customScript: {
    name: i18next.t("common.script.tag"),
    color: "#26CEA4",
  },
  database: {
    name: i18next.t("common.database.tag"),
    color: "#3B75FF",
  },
  pickVars: {
    name: i18next.t("common.set_variables.tag"),
    color: "#8D56FF",
  },
  default: {
    name: i18next.t("supplement.default"),
    color: "#698296",
  },
  else: {
    name: "else",
    color: "#698296",
  },
} as const;
