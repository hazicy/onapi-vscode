import { RequestBodyContentType } from "@onapi/domain/requests/types/request";
import i18next from "i18next";
import { cloneDeep, concat, findIndex, head, isEqual } from "lodash";

export const ALL_KEY = "all";

export enum STATUS_CODE {
  ENABLE = 1,
  DISABLE = -1,
}

export enum ERROR_STATUS {
  /** Success */
  SUCCESS = 0,
  /** Error */
  ERROR = 1,
  /** Not executed or status abnormal */
  UN_EXECUTED = -1,
}

export const VARIABLE_LIST_CONTENT_KEY = "variable-list-content-key";

export const BASE_COMPARE_TIMES_TYPES = [
  { value: "eq", label: i18next.t("common.assertion.condition.eq") },
  { value: "uneq", label: i18next.t("common.assertion.condition.neq") },
  { value: "lt", label: i18next.t("common.assertion.condition.lt") },
  { value: "lte", label: i18next.t("common.assertion.condition.lte") },
  { value: "gt", label: i18next.t("common.assertion.condition.gt") },
  { value: "gte", label: i18next.t("common.assertion.condition.gte") },
];

export const BASE_COMPARE_TYPES = [
  { value: "eq", label: i18next.t("common.assertion.condition.eq") || "Eq" },
  {
    value: "uneq",
    label: i18next.t("common.assertion.condition.neq") || "NEq",
  },
  { value: "lt", label: i18next.t("common.assertion.condition.lt") || "LT" },
  { value: "lte", label: i18next.t("common.assertion.condition.lte") || "LTE" },
  { value: "gt", label: i18next.t("common.assertion.condition.gt") || "GT" },
  { value: "gte", label: i18next.t("common.assertion.condition.gte") || "GTE" },
  {
    value: "includes",
    label: i18next.t("common.assertion.condition.contains") || "Contains",
  },
  {
    value: "unincludes",
    label: i18next.t("common.assertion.condition.ncontains") || "NContains",
  },
  {
    value: "null",
    label: i18next.t("common.assertion.condition.empty") || "Empty",
  },
  {
    value: "notnull",
    label: i18next.t("common.assertion.condition.nempty") || "NEmpty",
  },
  {
    value: "exist",
    label: i18next.t("common.assertion.condition.exists") || "Exists",
  },
  {
    value: "notexist",
    label: i18next.t("common.assertion.condition.nexists") || "NExists",
  },
  {
    value: "regularmatch",
    label: i18next.t("common.assertion.condition.regex") || "Regex",
  },
  {
    value: "belongscollection",
    label: i18next.t("common.assertion.condition.in") || "In",
  },
  {
    value: "notbelongscollection",
    label: i18next.t("common.assertion.condition.nin") || "NIn",
  },
];

export const HIDE_VALUE_COMPARE_TYPES = [
  "null",
  "notnull",
  "exist",
  "notexist",
];
export const SELECT_MODE_COMPARE_TYPES = [
  "belongscollection",
  "notbelongscollection",
];
export const HIDE_TOOLS_COMPARE_TYPES = [
  "responseText",
  "responseHeader",
  "responseCookie",
  "responseCode",
  "responseTime",
  "tempVars",
  "envVars",
  "globalVars",
];

export const VARIABLE_TIPS = [
  "eq",
  "uneq",
  "lt",
  "lte",
  "gt",
  "gte",
  "includes",
  "unincludes",
];
export const REGULAR_TIPS = ["regularmatch"];
export const COLLECTION_TIPS = ["belongscollection", "notbelongscollection"];

// Assume these SVG components are already React components
export const ICONS_MAP: Record<string, any> = {
  api: {
    icon: "globe",
    gradientColor: ["#F6504B", "#F98E8B"],
  },
  doc: {
    icon: "file-text",
    gradientColor: ["#3974FF", "#86AAFF"],
  },
  websocket: {
    icon: "radio",
    gradientColor: ["#FFC70E", "#FFDC69"],
  },
  socket_method: {
    icon: "cable",
    gradientColor: ["#06D7BB", "#66E7D5"],
  },
  grpc: {
    icon: "network",
    gradientColor: ["#FF8F0F", "#FFB058"],
  },
  folder: {
    icon: "folder-plus",
    gradientColor: ["#58BDD3", "#69D5EC"],
  },
  diy: {
    icon: "palette",
    gradientColor: ["#3974FF", "#86AAFF"],
  },
  project: {
    icon: "folder-kanban",
    gradientColor: ["#9868FF", "#B49AEE"],
  },
  sse: {
    icon: "radio-tower",
    gradientColor: ["#65E0FF", "#50CFEA"],
  },
};

// Type to text mapping
export const TEXT_TYPE: Record<string, string> = {
  api: i18next.t("common.kind.http"),
  sse: i18next.t("common.kind.sse"),
  doc: i18next.t("common.kind.doc"),
  websocket: i18next.t("common.kind.websocket"),
  socket_method: "TCP",
  socket: i18next.t("common.kind.tcp_client"),
  grpc: i18next.t("common.kind.grpc"),
  folder: i18next.t("common.kind.folder"),
  sample: i18next.t("common.kind.cases"),
  project: i18next.t("common.kind.project"),
  diy: i18next.t("docs.document.custom_share"),
};

// Theme color mapping
export const PRIMARY_COLOR_MAP: Record<string, string> = {
  purple: "#0e639c",
  pinkpurple: "#0e639c",
  blue: "#0e639c",
  green: "#0e639c",
  pink: "#0e639c",
  orange: "#0e639c",
  lakeblue: "#0e639c",
  golden: "#0e639c",
  deongaree: "#0e639c",
  windred: "#0e639c",
};

// Theme list
export const THEME_COLOR_MAP = [
  {
    key: "white",
    value: i18next.t("supplement.white"),
  },
  {
    key: "orange",
    value: "Eye Protection",
  },
  {
    key: "gray",
    value: i18next.t("supplement.dark_blue"),
  },
  {
    key: "lightgray",
    value: "Light Gray",
  },
  {
    key: "darkgrey",
    value: "Dark Gray",
  },
  {
    key: "dark",
    value: i18next.t("supplement.black"),
  },
];

// Share status
export const EXPIRE_DAYS: { [key: string]: string } = {
  "-99": i18next.t("docs.share_modal.validity_detail.closed"),
  "-1": i18next.t("docs.share_modal.validity_detail.permanent"),
  "7": i18next.t("docs.share_modal.validity_detail.valid_for_sevendays"),
  "30": i18next.t("docs.share_modal.validity_detail.valid_for_thirtydays"),
};

// Request methods
export const API_METHODS: string[] = [
  "POST",
  "GET",
  "PUT",
  "PATCH",
  "DELETE",
  "COPY",
  "HEAD",
  "OPTIONS",
  "LINK",
  "UNLINK",
  "PURGE",
  "LOCK",
  "UNLOCK",
  "PROPFIND",
  "VIEW",
];

export enum DEFAULT_OPEN_NEW_TAB_ENUM {
  PREVIEW = "preview",
  DEBUG = "debug",
}

// Default tab options for new/open API
export const DEFAULT_OPEN_NEW_TAB_OPTIONS = [
  {
    label: i18next.t("system_settings.general.default_tab_debug"),
    value: DEFAULT_OPEN_NEW_TAB_ENUM.DEBUG,
  },
];

// Request methods
export const GRPC_METHODS: string[] = ["gRPC", "gRPC TLS"];

export const TCP_METHODS: string[] = ["TCP"];
// ['Raw', 'Socket.IO', 'SockJs'];

export const WEBSOCKET_METHODS: string[] = ["Raw", "Socket.IO"];

export const METHODS_MAP: Record<string, string[]> = {
  api: API_METHODS,
  sse: API_METHODS,
  grpc: GRPC_METHODS,
  tcp: TCP_METHODS,
  websocket: WEBSOCKET_METHODS,
};

// Request method colors
export const API_METHODS_COLOR: Record<string, string> = {
  POST: "var(--color-warning)",
  GET: "var(--color-success)",
  PUT: "var(--color-info)",
  DELETE: "var(--color-error)",
  default: "var(--color-success)",
};

// Request content types
export const CONTENT_TYPES: Record<string, string> = {
  none: "none",
  "form-data": "multipart/form-data",
  urlencoded: "application/x-www-form-urlencoded",
  json: "application/json",
  xml: "application/xml",
  javascript: "application/javascript",
  plain: "text/plain",
  html: "text/html",
  binary: "application/octet-stream",
};

// Request content types

export const API_CONTENT_TYPES = [
  "none",
  "form-data",
  "urlencoded",
  "json",
  "xml",
  "javascript",
  "plain",
  "html",
  "binary",
];

// OpenAPI request types
export const OPENAPI_TYPES: Record<string, RequestBodyContentType> = {
  "application/json": "json",
  "application/xml": "xml",
  "text/plain": "plain",
  "multipart/form-data": "form-data",
  "application/x-www-form-urlencoded": "urlencoded",
  "text/html": "html",
  "application/javascript": "javascript",
};

export const FIELD_TYPES = [
  "Array",
  "Boolean",
  "Function",
  "NaN",
  "Number",
  "Float",
  "Integer",
  "Object",
  "RegExp",
  "String",
  "Undefined",
  "Null",
  "Date",
];

export enum TABS_OPERATES_ENUM {
  CLONE_CURRENT = "clone_current",
  CLOSE_CURRENT = "close_current",
  CLOSE_ALL = "close_all",
  FORCE_CLOSE_ALL = "force_close_all",
  CLOSE_OTHER = "close_other",
  FORCE_CLOSE_OTHER = "force_close_other",
  SAVE_ALL = "save_all",
}

export const genTabsOperatesOptions = (
  options: {
    label: string;
    key: TABS_OPERATES_ENUM;
    disabled?: boolean;
  }[],
  config?: { saveAllLoading?: boolean },
  curTargetId?: string,
) => {
  const tabsOperatesOptions = cloneDeep(options);

  // Remove clone operation for all APIs tab
  if (
    isEqual(curTargetId, "all") &&
    isEqual(head(tabsOperatesOptions)?.key, TABS_OPERATES_ENUM.CLONE_CURRENT)
  ) {
    tabsOperatesOptions.shift();
  }

  const saveAllIndex = findIndex(
    tabsOperatesOptions,
    (item) => item.key === TABS_OPERATES_ENUM.SAVE_ALL,
  );

  if (config?.saveAllLoading) {
    tabsOperatesOptions[saveAllIndex].disabled = true;
    tabsOperatesOptions[saveAllIndex].label = i18next.t(
      "supplement.saving_all",
    );

    return tabsOperatesOptions;
  }

  return tabsOperatesOptions;
};

export const TABS_OPERATES_OPTIONS = [
  {
    label: i18next.t("common.tab_operation.close_all"),
    key: TABS_OPERATES_ENUM.CLOSE_ALL,
  },
  {
    label: i18next.t("common.tab_operation.force_close_all"),
    key: TABS_OPERATES_ENUM.FORCE_CLOSE_ALL,
  },
  {
    label: i18next.t("common.tab_operation.close_other"),
    key: TABS_OPERATES_ENUM.CLOSE_OTHER,
  },
  {
    label: i18next.t("common.tab_operation.force_close_other"),
    key: TABS_OPERATES_ENUM.FORCE_CLOSE_OTHER,
  },
  {
    label: i18next.t("common.tab_operation.save_all"),
    key: TABS_OPERATES_ENUM.SAVE_ALL,
    disabled: false,
  },
];

export const TABS_ITEM_OPTIONS = concat(
  [
    {
      label: i18next.t("supplement.clone_cur_tab"),
      key: TABS_OPERATES_ENUM.CLONE_CURRENT,
    },
    {
      label: i18next.t("supplement.close_cur_tab"),
      key: TABS_OPERATES_ENUM.CLOSE_CURRENT,
    },
  ],
  TABS_OPERATES_OPTIONS,
);

// HTTP response status codes
export const HTTP_RESPONSE_CODE_LIST = [
  200, 201, 202, 301, 302, 304, 400, 401, 403, 404, 500, 503,
];

export const VERSION_UPDATE_KEY = "version-update-key";

export const SYNC_IMPORT_SUCCESS_KEY = "sync-import-success-key";
export const SYNC_IMPORT_FAIL_KEY = "sync-import-fail-key";

/** Client close without prompt */

/** Client download URL */
