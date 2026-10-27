import i18next from "i18next";

type SocketAssertTypes = {
  value: string;
  title: string;
  description?: string;
  placeholder?: string;
  suffixText?: string;
};

export const SOCKET_ASSERT_TYPES: SocketAssertTypes[] = [
  {
    value: "responseJson",
    title: "Response JSON",
    description: i18next.t("common.assertion.json_tip"),
    placeholder: i18next.t("common.assertion.expression.json_tip"),
  },
  {
    value: "responseXml",
    title: "Response XML",
    description: i18next.t("common.assertion.xml_tip"),
    placeholder: i18next.t("common.assertion.expression.xml_tip"),
  },
  {
    value: "responseText",
    title: "Response Text",
  },
  {
    value: "responseHeader",
    title: "Response Header",
    placeholder: i18next.t("common.assertion.expression.header_tip"),
  },
  {
    value: "responseCookie",
    title: "Response Cookie",
    placeholder: i18next.t("common.assertion.expression.xml_tip"),
  },
  {
    value: "responseCode",
    title: i18next.t("common.assertion.status"),
  },
  {
    value: "responseTime",
    title: i18next.t("common.assertion.time"),
    suffixText: "ms",
  },
  {
    value: "tempVars",
    title: i18next.t("common.assertion.transient_variables"),
    placeholder: i18next.t("supplement.var_no"),
  },
  {
    value: "envVars",
    title: i18next.t("common.assertion.environment_variables"),
    placeholder: i18next.t("supplement.var_no"),
  },
  {
    value: "globalVars",
    title: i18next.t("common.assertion.global_variables"),
    placeholder: i18next.t("supplement.var_no"),
  },
];
