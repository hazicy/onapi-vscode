import { ApisBaseDataItem } from "@onapi/http-model/requests/types/base";
import { DefaultRequestSystemHeaders } from "@onapi/http-model/requests/types/request";
import { CustomNumberBooleanType } from "@onapi/http-model/types/common";

import i18next from "i18next";
import { snowflakeId } from "@onapi/http-model/utils/data-tools";

// Default shared socket parameters; HTTP inheritance lives on SDK collection items.
export const DEFAULT_SOCKET_GLOBAL_PARAMS = {
  header: { parameter: [] },
  query: { parameter: [] },
  cookie: { parameter: [] },
};

export const DEFAULT_WEBSOCKET_REQUEST = {
  // event: {
  //   parameter: [],
  // },
  header: {
    parameter: [],
  },
  query: {
    parameter: [],
  },
};

export const DEFAULT_WEBSOCKET_MESSAGE = {
  name: i18next.t("supplement.msg") || "Message",
  param_id: snowflakeId(),
  request: {
    mode: "text",
    raw: "",
    raw_parameter: [],
    raw_schema: { type: "object" },
  },
  response: {
    mode: "text",
    raw: "",
    raw_parameter: [],
    raw_schema: { type: "object" },
  },
};

export const PARAMETER_ITEM: ApisBaseDataItem = {
  description: "",
  field_type: "String" as ApisBaseDataItem["field_type"],
  is_checked: 1 as CustomNumberBooleanType,
  key: "",
  value: "",
  not_null: 1 as CustomNumberBooleanType,
  static: true,
  // file_base64: '',
  // file_name: '',
  // content_type: '',
};

// apipost default request headers
export const DEFAULT_REQUEST_SYSTEM_HEADERS: DefaultRequestSystemHeaders[] = [
  {
    key: "Accept",
    value: "*/*",
    is_checked: 1,
    field_type: "String",
  },
  {
    key: "Accept-Encoding",
    value: "gzip, deflate, br",
    is_checked: 1,
    field_type: "String",
  },
  {
    key: "User-Agent",
    value: "OnapiRuntime/1.1.0",
    is_checked: 1,
    field_type: "String",
  },
  {
    key: "Connection",
    value: "keep-alive",
    is_checked: 1,
    field_type: "String",
  },
];

export const DEFAULT_SOCKETIO_REQUEST = {
  cookie: {
    parameter: [],
  },
  header: {
    parameter: [],
  },
  query: {
    parameter: [],
  },
  event: {
    parameter: [],
  },
};

// apipost default websocket request headers
export const DEFAULT_REQUEST_SYSTEM_HEADERS_WEBSOCKET: DefaultRequestSystemHeaders[] =
  [
    {
      key: "Host",
      value: "<calculated at runtime>",
      is_checked: 1,
      field_type: "String",
    },
    {
      key: "Connection",
      value: "Upgrade",
      is_checked: 1,
      field_type: "String",
    },
    {
      key: "Upgrade",
      value: "websocket",
      is_checked: 1,
      field_type: "String",
    },
    {
      key: "Sec-WebSocket-Key",
      value: "<calculated at runtime>",
      is_checked: 1,
      field_type: "String",
    },
    {
      key: "Sec-WebSocket-Version",
      value: "13",
      is_checked: 1,
      field_type: "String",
    },
    {
      key: "Sec-WebSocket-Extensions",
      value: "permessage-deflate; client_max_window_bits",
      is_checked: 1,
      field_type: "String",
    },
  ];
