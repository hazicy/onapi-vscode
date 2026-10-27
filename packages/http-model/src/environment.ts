import i18next from "i18next";

import type { VariableDefinition } from "postman-collection";
type IEnvDataItem = VariableDefinition & { static?: boolean };

export enum ENV_MANAGE_ENUM {
  cookie = "cookie",
  globalParm = "globalParm",
  globalVariable = "globalVariable",
}

export enum MENU_ITEMS_KEY {
  all = "all",
  env = "env",
}

export const MENU_ITEMS = [
  {
    label: i18next.t("global_setting.global_title"),
    key: MENU_ITEMS_KEY.all,
    children: [
      {
        label: i18next.t("global_setting.cookie"),
        key: ENV_MANAGE_ENUM.cookie,
        icon: "cookie",
      },
      {
        label: i18next.t("global_setting.global_key"),
        key: ENV_MANAGE_ENUM.globalParm,
        icon: "list-filter",
      },
      {
        label: i18next.t("global_setting.global_variables"),
        key: ENV_MANAGE_ENUM.globalVariable,
        icon: "variable",
      },
    ],
    type: "group",
    disableDraggable: true,
  },
  {
    label: i18next.t("global_setting.environment_list"),
    key: MENU_ITEMS_KEY.env,
    type: "group",
  },
];

export const DEFAULT_DATA_ITEM: IEnvDataItem = {
  key: "",
  value: "",
  description: "",
  static: true,
};

export const ENV_OPTIONS = [
  {
    value: "1",
    label: i18next.t("supplement.priv"),
    tip: i18next.t("supplement.only_own"),
    icon: "lock",
  },
  {
    value: "-1",
    label: i18next.t("supplement.public"),
    tip: i18next.t("supplement.only_team"),
    icon: "globe",
  },
];

export const ENV_LOCAL_ITEM = {
  env_id: "",
  name: i18next.t("global_setting.create"),
  is_private: -1,
  server_list: [],
  env_var_list: {},
  isLocal: true,
};
