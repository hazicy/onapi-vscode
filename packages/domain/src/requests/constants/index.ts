import i18next from "i18next";
import { values } from "lodash";
import type { FunctionComponent } from "react";

export { APIS_TARGET_TYPE_ENUM } from "../kinds";

export enum DEFAULT_API_MARK_ENUM {
  DEVELOPING = "1",
  COMPLATED = "2",
  MODIFYING = "3",
  ALL = "all",
}

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

export enum REQUEST_BODY_RAW_MODE_ENUM {
  JSON = "json",
  XML = "xml",
  JAVASCRIPT = "javascript",
  PLAIN = "plain",
  HTML = "html",
}

export const REQUEST_RAW_MODE_LIST = values(REQUEST_BODY_RAW_MODE_ENUM);

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
