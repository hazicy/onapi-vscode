import i18next from "i18next";

type SocketPickVarsTypes = {
  tableTip?: string;
  value: string;
  title: string;
  description?: string;
  tableTitle?: string;
};

export const SOCKET_PICK_VARS_TYPES: SocketPickVarsTypes[] = [
  {
    value: "responseJson",
    title: "Response JSON",
    description: i18next.t("common.set_variables.json_tip"),
    tableTitle: i18next.t("supplement.jsonpath_exp"),
    tableTip: i18next.t("supplement.ex_jsonpath"),
  },
  {
    value: "responseXml",
    title: "Response XML",
    description: i18next.t("common.set_variables.xml_tip"),
    tableTitle: i18next.t("supplement.xpath_exp"),
    tableTip: "/data/info[1]/name",
  },
  {
    value: "responseText",
    title: "Response Text",
    tableTitle: i18next.t("supplement.reg_exp"),
    tableTip: i18next.t("supplement.reg_exp_tip"),
  },
  {
    value: "responseHeader",
    title: "Response Header",
    tableTitle: i18next.t("supplement.header_key"),
  },
  {
    value: "responseCookie",
    title: "Response Cookie",
    tableTitle: i18next.t("supplement.cookie_key"),
  },
  {
    value: "responseTime",
    title: i18next.t("common.set_variables.time"),
    tableTitle: i18next.t("common.set_variables.time"),
  },
];
