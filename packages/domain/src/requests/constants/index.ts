import i18next from "i18next";
import { values } from "lodash";
import type { FunctionComponent } from "react";

import { ApiMark } from "@onapi/domain/requests/types/api";

export enum APIS_TARGET_TYPE_ENUM {
  API = "api",
  SSE = "sse",
  FOLDER = "folder",
  DOC = "doc",
  GRPC = "grpc",
  API_SAMPLE = "sample",
  API_SAMPLE_GROUP = "sample_group",
  SOCKET = "socket",
  SOCKET_METHOD = "socket_method",
  WEBSOCKET = "websocket",
  SOCKETIO = "socketio",
  GRAPHQL = "graphql",
}

export enum DEFAULT_API_MARK_ENUM {
  DEVELOPING = "1",
  COMPLATED = "2",
  MODIFYING = "3",
  ALL = "all",
}

export enum APIS_PRESSURE_MODE {
  COUNT = "1",
  DURATION = "2",
}

export enum APIS_PRESSURE_CONFIG_KEYS {
  USE_PRESSURE_DATA = "use_pressure_data",
  TEST_DATA_PATH = "test_data_path",
  CONCURRENCY = "concurrency",
  MODE = "mode",
  COUNT = "count",
  DURATION = "duration",
  LOG_TYPE = "log_type",
}

export enum PRESSURE_STATUS {
  /** Not started */
  NOT_STARTED = "NOT_STARTED",
  /** In progress */
  IN_PROGRESS = "IN_PROGRESS",
  /** Completed */
  COMPLETED = "COMPLETED",
}

export const DEFAULT_API_MARK_ENUM_MAP = {
  [DEFAULT_API_MARK_ENUM.DEVELOPING]: {
    value: DEFAULT_API_MARK_ENUM.DEVELOPING,
    label: i18next.t("settings.api_status.developing"),
    color: "#3A86FF",
    is_default: 1,
  },
  [DEFAULT_API_MARK_ENUM.COMPLATED]: {
    value: DEFAULT_API_MARK_ENUM.COMPLATED,
    label: i18next.t("settings.api_status.complete"),
    color: "#2BA58F",
    is_default: 1,
  },
  [DEFAULT_API_MARK_ENUM.MODIFYING]: {
    value: DEFAULT_API_MARK_ENUM.MODIFYING,
    label: i18next.t("settings.api_status.modifying"),
    color: "#EC4646",
    is_default: 1,
  },
};

export const DEFAULT_API_MARK_ENUM_ALL_OPTION: ApiMark = {
  value: DEFAULT_API_MARK_ENUM.ALL,
  label: i18next.t("settings.api_status.all"),
  color: "",
  is_default: 1,
};

export const DEFAULT_API_MARK_ENUM_LIST: ApiMark[] = values(
  DEFAULT_API_MARK_ENUM_MAP,
);

export const REQUEST_METHOD_MAP: { [key: string]: string } = {
  POST: "POST",
  GET: "GET",
  PUT: "PUT",
  PATCH: "PAT",
  DELETE: "DEL",
  COPY: "COPY",
  HEAD: "HEAD",
  OPTIONS: "OPT",
  LINK: "LINK",
  UNLINK: "ULIK",
  PURGE: "PURG",
  LOCK: "LOCK",
  UNLOCK: "ULCK",
  PROPFIND: "PROP",
  VIEW: "VIEW",
};

export const OPENAPI_REQUEST_BODY_MODE_RADIO_ENUM = [
  { key: "none", value: "none" },
  { key: "form-data", value: "multipart/form-data" },
  { key: "urlencoded", value: "application/x-www-form-urlencoded" },
  { key: "binary", value: "application/octet-stream" },
  { key: "raw", value: "raw" },
];

export const PROTOCOL_OPTIONS = [
  {
    value: "http/1.1",
    label: "http/1.1",
  },
  {
    value: "http/2",
    label: "http/2",
  },
];

export enum APIS_CREATE_ITEM_OTHER_ENUM {
  PASTE_APIS = "paste_apis",
  IMPORT_CURL = "import_curl",
  CREATE_FOLDER = "create_folder",
  IDEA_UPLOAD = "idea_upload",
  FETCH_WEBSITE = "fetch_website",
  CREATE_APIS = "create_apis",
  IMPORT_DATA = "import_data",
  IMPORT_TC_DATA = "import_tc_data",
  EXPORT_DATA = "export_data",
}

export enum APIS_MORE_OPERATE_ENUM {
  ADD = "add",
  EDIT = "edit",
  SHARE = "share",
  COPY = "copy",
  PASTE = "paste",
  CLONE = "clone",
  DELETE = "delete",
  RUN = "run",
  REPORT = "report",
  COPYASCURL = "copyAsCurl",
  COPYOPENAPIURL = "copyOpenApiUrl",
  EDITDATA = "editData",
  DISPLAYFINDER = "displayFinder",
}

export enum APIS_GRPC_PROTO_MORE_OPERATE_ENUM {
  CHECK_PROTO = "check_proto",
  CHECK_SERVICE = "check_service",
  IMPORT_PROTO = "import_proto",
  REIMPORT = "reimport",
  SERVICE_REFLECTION = "service_reflection",
  DELETE = "delete",
}

export enum APIS_GRPC_PROTO_TYPE_ENUM {
  PROTO = "proto",
  SERVICE = "service",
  METHOD = "method",
}

export enum REQUEST_BODY_MODE_ENUM {
  NONE = "none",
  FORM_DATA = "form-data",
  URLENCODED = "urlencoded",
  BINARY = "binary",
  RAW = "raw",
}

export enum DEBUG_REQUEST_BODY_MODE_ENUM {
  NONE = "none",
  FORM_DATA = "form-data",
  URLENCODED = "urlencoded",
  JSON = "json",
  BINARY = "binary",
  XML = "xml",
  JAVASCRIPT = "javascript",
  PLAIN = "plain",
  HTML = "html",
}

export enum OPENAPI_REQUEST_BODY_MODE_ENUM {
  FORM_DATA = "multipart/form-data",
  URLENCODED = "application/x-www-form-urlencoded",
  JSON = "application/json",
  BINARY = "application/octet-stream",
  XML = "application/xml",
  JAVASCRIPT = "application/javascript",
  PLAIN = "text/plain",
  HTML = "text/html",
}

export const OPENAPI_REQUEST_BODY_MODE_ARRAY = [
  "application/json",
  "multipart/form-data",
  "application/x-www-form-urlencoded",
  "application/octet-stream",
  "text/html",
  "application/xml",
  "application/javascript",
  "text/plain",
];

export enum REQUEST_BODY_RAW_MODE_ENUM {
  JSON = "json",
  XML = "xml",
  JAVASCRIPT = "javascript",
  PLAIN = "plain",
  HTML = "html",
}

export enum OPENAPI_REQUEST_BODY_RAW_MODE_ENUM {
  JSON = "application/json",
  XML = "application/xml",
  JAVASCRIPT = "application/javascript",
  PLAIN = "text/plain",
  HTML = "text/html",
}

export enum EXPECT_CONTENT_TYPE_ENUM {
  JSON = "json",
  XML = "xml",
  HTML = "html",
  BINARY = "binary",
}

export const OPENAPI_EXPECT_CONTENT_TYPE = [
  { key: "json", value: "application/json" },
  { key: "xml", value: "application/xml" },
  { key: "html", value: "text/html" },
  { key: "binary", value: "application/octet-stream" },
];

export const EXPECT_CONTENT_TYPE = values(EXPECT_CONTENT_TYPE_ENUM);

export const REQUEST_RAW_MODE_LIST = values(REQUEST_BODY_RAW_MODE_ENUM);

export const OPENAPI_REQUEST_RAW_MODE_LIST = values(
  OPENAPI_REQUEST_BODY_RAW_MODE_ENUM,
);

export const REQUEST_TYPE = [
  { value: "POST", label: "POST" },
  { value: "GET", label: "GET" },
  { value: "PUT", label: "PUT" },
  { value: "PATCH", label: "PATCH" },
  { value: "DELETE", label: "DELETE" },
  { value: "COPY", label: "COPY" },
  { value: "HEAD", label: "HEAD" },
  { value: "OPTIONS", label: "OPTIONS" },
  { value: "LINK", label: "LINK" },
  { value: "UNLINK", label: "UNLINK" },
  { value: "PURGE", label: "PURGE" },
  { value: "LOCK", label: "LOCK" },
  { value: "UNLOCK", label: "UNLOCK" },
  { value: "PROPFIND", label: "PROPFIND" },
  { value: "doc", label: i18next.t("supplement.md") },
  { value: "View", label: "view" },
];

export const DIFF_APIS_DETAILS_DATA_KEYS: { [x: string]: string } = {
  name: "name",
  parentId: "parentId",
  method: "method",
  mark_id: "mark_id",
  mock_url: "mock_url",
  request: "request",
  response: "response",
  socketConfig: "socketConfig",
  enable_server_mock: "enable_server_mock",
  script: "script",
  ai_expect: "ai_expect",
  enable_ai_expect: "enable_ai_expect",
  receive_complete_func: "receive_complete_func",
  description: "description",
  url: "url",
  protos: "protos",
  attribute_info: "attribute_info",
  tags: "tags",
  server_id: "server_id",
};

export const SHARE_TYPE_MAP_NAME: { [k: string]: string } = {
  api: i18next.t("common.kind.http"),
  sse: i18next.t("common.kind.sse"),
  folder: i18next.t("common.kind.folder"),
  doc: i18next.t("common.kind.doc"),
  websocket: "WebSocket",
  socketio: "Socket.IO",
  grpc: "gRPC",
  socket: i18next.t("common.kind.tcp_client"),
  socket_method: i18next.t("common.kind.tcp_method"),
  project: i18next.t("common.kind.project"),
};

// Common request headers array
export const REQUEST_HEADER = [
  "Accept",
  "Accept-Charset",
  "Accept-Encoding",
  "Accept-Language",
  "Access-Control-Request-Headers",
  "Access-Control-Request-Method",
  "Authorization",
  "Cache-Control",
  "Content-MD5",
  "Content-Length",
  "Content-Transfer-Encoding",
  "Content-Type",
  "Cookie",
  "Cookie2",
  "Date",
  "Expect",
  "From",
  "Host",
  "lf-Match",
  "lf-Modified-Since",
  "lf-None-Match",
  "lf-Range",
  "If-Unmodified-Since",
  "Keep-Alive",
  "Max-Forwards",
  "Origin",
  "Pragma",
  "Proxy-Authorization",
  "Range",
  "Referer",
  "TE",
  "Trailer",
  "Transfer-Encoding",
  "Upgrade",
  "User-Agent",
  "Via",
  "Warning",
  "X-Requested-With",
  "X-Do-Not-Track",
  "DNT",
  "x-api-key",
  "Connection",
];

// Common request content-type
export const REQUEST_CONTENT_TYPE = [
  "application/octet-stream",
  "application/json",
  "application/xml",
  "text/plain",
  "text/html",
];

export enum APIS_TASK_TYPES_ENUM {
  CUSTOM_SCRIPT = "customScript",
  DATABASE = "database",
  ASSERT = "assert",
  PICK_VARS = "pickVars",
  WAIT = "wait",
}

export const APIS_CONTENT_MAP: {
  [key: string]:
    | FunctionComponent<{ apisData: any; onApisDataChange: any }>
    | {
        value: string;
        label: string;
        children: FunctionComponent<{
          apisData: any;
          onApisDataChange: any;
        }> | null;
      }[];
} = {
  api: [
    {
      value: "debug",
      label: i18next.t("common.api_tab.run"),
      children: null,
    },
    {
      value: "sample",
      label: i18next.t("common.api_tab.case"),
      children: null,
    },
    {
      value: "pressure",
      label: i18next.t("common.api_tab.stress"),
      children: null,
    },
    {
      value: "mock",
      label: i18next.t("common.api_tab.mock"),
      children: null,
    },
  ],
};
