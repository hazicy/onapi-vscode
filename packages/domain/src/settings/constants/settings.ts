import { SysConfig } from "@onapi/domain/settings/types/settings";

import i18next from "i18next";
import {
  DEFAULT_REQUEST_SYSTEM_HEADERS,
  DEFAULT_REQUEST_SYSTEM_HEADERS_WEBSOCKET,
} from "@onapi/domain/requests/constants/request";
import { STATUS_CODE } from "@onapi/domain/constants/common";

export enum IMPORT_TYPE_ENUM {
  POSTMAN = "postman",
  SWAGGER = "swagger",
  SWAGGERURL = "swaggerUrl",
  APIFOX = "apifox",
  APIZZA = "apizza",
  EOLINK = "eolink",
  YAPI = "yapi",
  ONAPI = "onapi",
  CURL = "curl",
  MD = "md",
  HAR = "har",
  INSOMNIA = "insomnia",
  APIDOC = "apidoc",
  THUNDER_CLIENT = "thunderClient",
}

export const TABLE_COLUMN_SWITCH_DEFAULT_CONFIG = {
  parameter_description: STATUS_CODE.DISABLE,
  parameter_type: STATUS_CODE.DISABLE,
  content_type: STATUS_CODE.ENABLE,
};

export const SYS_CONFIG: SysConfig = {
  global_cookie_open: 1, // Global cookie enable/disable
  bg_color: "dark", //  Background: dark, white, gray
  theme_color: "pinkpurple", //  Theme color [orange, blue, green, pink, purple, lakeblue, pinkpurple]
  font_scale: 100, //  Font scale
  font_family: "", // Font family
  font_size: 12, // Font size
  language: "en", //  Language: en, zh-cn
  send_timeout: 10000, //  Default request timeout
  auto_redirect: -1, //  Auto redirect: enable 1, disable -1
  max_redirect_time: 5, //  Max auto redirect count: max_redirect_time
  auto_gen_mock_url: 1, //  Auto detect request params for Mock: enable 1, disable -1
  request_param_auto_json: -1, //  Auto JSON encode request data: enable 1, disable -1
  proxy: 2, //  Proxy mode: 1-use, 2-don't use, 3-custom
  request_proxy_sys_open: -1, //  Prioritize HTTP PROXY, HTTPS PROXY, NO PROXY system env vars: 1-enable -1-disable
  request_proxy_bypass: "", //  PROXY BYPASS, comma separated IPs
  request_proxy_auth_open: -1, //  Auth enable/disable: 1-enable -1-disable
  request_proxy_auth: {
    request_proxy_auth_username: "", //  Auth username: request_proxy_auth_username
    request_proxy_auth_password: "", //  Auth password: request_proxy_auth_password
  },
  request_proxy_type: ["http"], //  Request proxy type: request_proxy_type [http, https]
  request_proxy_url: "", //  Request proxy server URL: request_proxy_url (format: ip)
  request_proxy_port: 0, //  Request proxy server port: request_proxy_port (format: port)
  ca_certificate: {
    //  CA certificate enable/disable
    open: -1,
    file_url: "",
    file_base64: "",
    file_name: "",
  },
  client_certificate: {}, //  Client certificate
  send_after_save_example: 1, // Save response example after request: 1-enable -1-disable
  assertions_and_validation_results: -1, //  Show assertion and validation results by default: 1-enable -1-disable
  send_after_response_to_tab: -1, // Switch to "Response" tab after request: 1-enable -1-disable
  send_after_auto_beautify: -1, // Auto switch to "Pretty" panel after request: 1-enable -1-disable
  request_method: "POST", //  Default request method for new API
  request_mode: "none", //  Default request mode for new API
  request_query_add_equal: 1, //  Auto add equals to query params: 1-enable -1-disable
  auto_open_clone_new_tab: -1, //  Auto jump to new tab after clone: 1-enable -1-disable
  // max_console_save: 10, //  Max console entries to keep
  folder_click_set: 1, //  Folder click behavior: 1-open tab, 2-collapse/expand
  open_new_tab: "debug",
  tab_direction: 1, // API split screen direction
  client_close_config: 1, // Client close button behavior
  generate_code_mode: ["shell", "curl"], // Default code generation type
  /**System request headers */
  systemRequestHeader: DEFAULT_REQUEST_SYSTEM_HEADERS,
  systemRequestHeaderWebSocket: DEFAULT_REQUEST_SYSTEM_HEADERS_WEBSOCKET,
  request_header_column_switch: { ...TABLE_COLUMN_SWITCH_DEFAULT_CONFIG }, // Request header column config
  request_body_column_switch: { ...TABLE_COLUMN_SWITCH_DEFAULT_CONFIG }, // Request body column config
  request_query_column_switch: { ...TABLE_COLUMN_SWITCH_DEFAULT_CONFIG }, // Request query column config
  request_cookie_column_switch: { ...TABLE_COLUMN_SWITCH_DEFAULT_CONFIG }, // Request cookie column config
  raw_parameter_column_switch: { ...TABLE_COLUMN_SWITCH_DEFAULT_CONFIG }, // Parameter description column config
  raw_parameter_pilot_bubble_switch: false,
  import_data_init_type: IMPORT_TYPE_ENUM.POSTMAN,
};

export const IMPORT_TYPE_MAP: {
  [key: string]: { name: string; id: number; tips: string };
} = {
  postman: {
    name: "postman",
    id: 1,
    tips: "settings.import_project.postman_tips",
  },
  swagger: {
    name: "swagger",
    id: 2,
    tips: "settings.import_project.swagger_tips",
  },
  swaggerUrl: {
    name: "swaggerUrl",
    id: 3,
    tips: "settings.import_project.swagger_tips",
  },
  knife4j: {
    name: "knife4j",
    id: 3,
    tips: "settings.import_project.other_tips",
  },
  apifox: {
    name: "apifox",
    id: 4,
    tips: "settings.import_project.other_tips",
  },
  apizza: {
    name: "apizza",
    id: 5,
    tips: "settings.import_project.other_tips",
  },
  eolink: {
    name: "eolink",
    id: 6,
    tips: "settings.import_project.other_tips",
  },
  yapi: {
    name: "yapi",
    id: 7,
    tips: "settings.import_project.other_tips",
  },
  onapi: {
    name: "onapi",
    id: 8,
    tips: "settings.import_project.onapi_tips",
  },
  curl: {
    name: "curl",
    id: 9,
    tips: "supplement.support_api_add_curl",
  },
  md: {
    name: "md",
    id: 10,
    tips: "supplement.support_imp_md",
  },
  har: {
    name: "har",
    id: 11,
    tips: "supplement.support_imp_har",
  },
  insomnia: {
    name: "insomnia",
    id: 11,
    tips: "supplement.support_imp_ins",
  },
  apidoc: {
    name: "apidoc",
    id: 12,
    tips: "supplement.support_imp_apidoc",
  },
  thunderClient: {
    name: "thunderClient",
    id: 13,
    tips: "settings.import_project.thunder_client_tips",
  },
};

export const IMPORT_TIP_MAP = {
  [IMPORT_TYPE_ENUM.SWAGGERURL]: "Enter Swagger URL",
  [IMPORT_TYPE_ENUM.MD]: i18next.t("supplement.select_md"),
};

export const IMPORT_TYPE_LIST = [
  { key: IMPORT_TYPE_ENUM.SWAGGER, value: "Swagger", icon: "braces" },
  {
    key: IMPORT_TYPE_ENUM.SWAGGERURL,
    value: "Swagger URL",
    icon: "braces",
  },
  { key: IMPORT_TYPE_ENUM.CURL, value: "Import cURL", icon: "terminal" },
  { key: IMPORT_TYPE_ENUM.POSTMAN, value: "Postman", icon: "send" },
  {
    key: IMPORT_TYPE_ENUM.THUNDER_CLIENT,
    value: "Thunder Client",
    icon: "zap",
  },
  {
    key: IMPORT_TYPE_ENUM.ONAPI,
    value: "onapi",
    icon: "onapi",
  },
];

export const SWAGGER_INCLUDES = [
  IMPORT_TYPE_ENUM.SWAGGER,
  IMPORT_TYPE_ENUM.SWAGGERURL,
];

export const EXPORT_TYPE_MAP: {
  [key: string]: { name: string; id: number; tips: string };
} = {
  onapi: {
    name: "onapi",
    id: 1,
    tips: i18next.t("supplement.old_imp"),
  },
  swagger: {
    name: "swagger",
    id: 2,
    tips: i18next.t("supplement.old_imp"),
  },
  postman: {
    name: "Postman 2.1",
    id: 3,
    tips: i18next.t("supplement.old_imp"),
  },
};
export const EXPORT_TYPE_LIST = [
  {
    key: "onapi",
    value: "onapi",
    icon: "onapi",
    tip: "You can import the exported file into any onapi platform.",
  },
  {
    key: "swagger",
    value: "Swagger",
    icon: "braces",
    tip: "You can import the exported file into Swagger platform.",
  },
  {
    key: "postman",
    value: "Postman 2.1",
    icon: "send",
    tip:
      i18next.t("settings.export_project.postman_tips") ||
      "Export as Postman Collection (supports only HTTP/1.1 and HTTP/2 protocols).",
  },
];

export const SWAGGER_FULL_API_OPTIONS = [
  {
    value: "clear",
    label: i18next.t("supplement.overwrite_clear"),
  },
  {
    value: "url",
    label: i18next.t("supplement.overwrite_same_api"),
  },
  {
    value: "url_and_folder",
    label: i18next.t("supplement.overwrite_same_api_folder"),
  },
  {
    value: "ignore",
    label: i18next.t("supplement.overwrite_same_api_no"),
  },
  {
    value: "both",
    label: i18next.t("supplement.overwrite_same_api_all"),
  },
];

export const SWAGGER_FULL_MODAL_OPTIONS = [
  {
    value: "clear",
    label: i18next.t("supplement.overwrite_clear"),
  },
  {
    value: "name",
    label: i18next.t("supplement.overwrite_same_model"),
  },
  {
    value: "ignore",
    label: i18next.t("supplement.overwrite_same_model_no"),
  },
];

export const SWAGGER_FULL_ENV_OPTIONS = [
  {
    value: "none",
    label: i18next.t("supplement.wont_imp_env"),
  },
  {
    value: "both",
    label: i18next.t("supplement.imp_add_env"),
  },
];

export const APIPOST_FULL_ENV_OPTIONS = [
  {
    value: "both",
    label: "Add new environment",
  },
];

export enum ImportLocationEnum {
  append = "append",
  create = "create",
}

export enum ExportConfigEnum {
  request = "request",
  model = "model",
  env = "env",
}

export const EXPORT_PREVIEW_CONFIG_ITEMS = [
  {
    label: "APIs",
    key: ExportConfigEnum.request,
  },

  {
    label: "Environment",
    key: ExportConfigEnum.env,
  },
];

export const EXPORT_CONFIG_ITEMS = [
  {
    label: i18next.t("supplement.apis"),
    key: ExportConfigEnum.request,
  },
  {
    label: i18next.t("supplement.schemas"),
    key: ExportConfigEnum.model,
  },
  {
    label: i18next.t("supplement.environment"),
    key: ExportConfigEnum.env,
  },
];

export const EXPORT_CONFIG_NONE_ITEMS = [
  {
    label: i18next.t("supplement.apis") || "APIs",
    key: ExportConfigEnum.request,
  },
];

export const EXPORT_CONFIG_NOMODEL_ITEMS = [
  {
    label: i18next.t("supplement.apis"),
    key: ExportConfigEnum.request,
  },
  {
    label: i18next.t("supplement.environment"),
    key: ExportConfigEnum.env,
  },
];

/**
 * Language type
 */

export enum LANGUAGE_TYPE {
  en = "en",
  zh = "zh-cn",
  ja = "ja",
  tw = "zh-hant",
  id = "id",
}

/**
 * Mock language type map
 */

export const MOCK_LANGUAGE_MAP = {
  [LANGUAGE_TYPE.zh]: "zh-CN",
  [LANGUAGE_TYPE.en]: "en",
  [LANGUAGE_TYPE.ja]: "ja",
  [LANGUAGE_TYPE.tw]: "zh-TW",
  [LANGUAGE_TYPE.id]: "id",
};

export enum EXPORT_TYPE_ENUM {
  onapi = "onapi",
  swagger = "swagger",
  postman = "postman",
}
