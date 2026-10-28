import i18next from "i18next";

import { ApiDetailsData } from "@onapi/domain/requests/types/api";
import { SampleGroupsDetailsData } from "@onapi/domain/requests/types/api-sample";
import { ApisBaseData } from "@onapi/domain/requests/types/base";
import { DocDetailsData } from "@onapi/domain/requests/types/doc";

import { GrpcDetailsData } from "@onapi/domain/requests/types/grpc";
import { SocketDetailsData } from "@onapi/domain/requests/types/socket";
import { SocketServiceDetailsData } from "@onapi/domain/requests/types/socket-service";

import { APIS_TARGET_TYPE_ENUM, DEFAULT_API_MARK_ENUM } from "@onapi/domain/requests/constants/index";
import {
  DEFAULT_WEBSOCKET_REQUEST,
  DEFAULT_WEBSOCKET_MESSAGE,
} from "@onapi/domain/requests/constants/request";
import { DEFAULT_API_RESPONSE } from "@onapi/domain/requests/constants/response";

import { snowflakeId } from "@onapi/domain/utils/data-tools";
import { WebSocketDetailsData } from "@onapi/domain/requests/types/websocket";
import { SocketIoDetailsData } from "@onapi/domain/requests/types/socketio";

// apis base parameters
export const DEFAULT_APIS_BASE_DATA: ApisBaseData = {
  project_id: "-1",
  id: "",
  parentId: "0",
  kind: APIS_TARGET_TYPE_ENUM.API,
  name: i18next.t("common.folder_operate.new_http") || "HTTP Request",
  sort: 0,
  version: 0,
  mark_id: DEFAULT_API_MARK_ENUM.DEVELOPING,
  status: 1,
};

// api default parameters
export const DEFAULT_API_DATA = {
  ...DEFAULT_APIS_BASE_DATA,
  kind: APIS_TARGET_TYPE_ENUM.API,
  request: { method: "GET", url: "", header: [] },
  event: [],
  response: [],
};

// sse default parameters
export const DEFAULT_SSE_DATA = {
  ...DEFAULT_APIS_BASE_DATA,
  kind: APIS_TARGET_TYPE_ENUM.SSE,
  name: "SSE Request",
  request: {
    method: "GET",
    url: "",
    header: [{ key: "Accept", value: "text/event-stream" }],
  },
  event: [],
  response: [],
};

// folder default parameters
export const DEFAULT_FOLDER_DATA = {
  ...DEFAULT_APIS_BASE_DATA,
  kind: APIS_TARGET_TYPE_ENUM.FOLDER,
  name: "Folder",
  auth: undefined,
  event: [],
  variable: [],
};

// doc default parameters
export const DEFAULT_DOC_DATA: DocDetailsData = {
  ...DEFAULT_APIS_BASE_DATA,
  name: i18next.t("supplement.new_md"),
  kind: APIS_TARGET_TYPE_ENUM.DOC,
  tags: [],
  attribute_info: {},
  description: "",
};

// websocket default request parameters
export const DEFAULT_WEBSOCKET_DATA: WebSocketDetailsData = {
  ...DEFAULT_APIS_BASE_DATA,
  name: i18next.t("supplement.new_websocket"),
  kind: APIS_TARGET_TYPE_ENUM.WEBSOCKET,
  method: "",
  request: DEFAULT_WEBSOCKET_REQUEST,
  message: [DEFAULT_WEBSOCKET_MESSAGE],
  url: "",
  description: "",
  attribute_info: {},
  tags: [],
  config: {
    certificate_verification: -1,
    information_size: 5,
    reconnect_num: 5,
    reconnect_time: 5000,
    shake_hands_timeout: 0,
  },
};

// grpc default request parameters
export const DEFAULT_GRPC_DATA: GrpcDetailsData = {
  ...DEFAULT_APIS_BASE_DATA,
  name: i18next.t("grpc.new_grpc.title"),
  kind: APIS_TARGET_TYPE_ENUM.GRPC,
  description: "",
  protos: [],
  request: {
    description: "",
  },
};

// api sample default parameters
export const DEFAULT_API_SAMPLE_DATA: Omit<
  ApiDetailsData,
  "description" | "attribute_info"
> = {
  ...DEFAULT_APIS_BASE_DATA,
  ai_expect_enable: -1,
  name: i18next.t("common.folder_operate.new_testcase"),
  kind: APIS_TARGET_TYPE_ENUM.API_SAMPLE,
  method: "GET",
  url: "",
  request: { method: "GET", url: "", header: [] },
  event: [],
  response: [],
  is_check_result: 1,
  is_force: -1,
  is_socket: 1,
  is_locked: -1,
  protocol: "http/1.1",
  ai_expect: {
    list: [],
    none_math_expect_id: "",
  },
};

// api sample group default parameters
export const DEFAULT_API_SAMPLE_GROUP_DATA: SampleGroupsDetailsData = {
  ...DEFAULT_APIS_BASE_DATA,
  name: i18next.t("supplement.new_group"),
  group_id: "",
  kind: APIS_TARGET_TYPE_ENUM.API_SAMPLE_GROUP,
};

// tcp service default parameters
export const DEFAULT_SOCKET_SERVICE_DATA: SocketServiceDetailsData = {
  ...DEFAULT_APIS_BASE_DATA,
  name: i18next.t("supplement.new_tcp_client"),
  method: "TCP",
  kind: APIS_TARGET_TYPE_ENUM.SOCKET,
  description: "",
  url: "",
  request: {
    timeout: 10,
    end_func: {
      name: "none",
      option: "",
    },
  },
};

// tcp default parameters
export const DEFAULT_SOCKET_DATA: SocketDetailsData = {
  ...DEFAULT_APIS_BASE_DATA,
  name: i18next.t("supplement.new_tcp_method"),
  method: "TCP",
  kind: APIS_TARGET_TYPE_ENUM.SOCKET_METHOD,
  description: "",
  request: {
    body: {
      mode: "xml",
      parameter: [],
      raw: "",
      raw_parameter: [],
      raw_schema: {
        type: "object",
      },
    },
    post_tasks: [],
    configs: {
      charset: "utf8",
      func: {
        request: [],
        response: [],
      },
    },
  },
  response: DEFAULT_API_RESPONSE,
  is_exampled: -1,
  is_locked: -1,
  tags: [],
};

// One-click stress test default parameters

export const INIT_DEFAULT_API_DATAS = [
  { ...DEFAULT_FOLDER_DATA, name: "Samples" },
  {
    ...DEFAULT_API_DATA,
    name: "Get request",
    request: { method: "GET", url: "{{baseUrl}}/get", header: [] },
  },
  {
    ...DEFAULT_API_DATA,
    name: "Post JSON",
    request: {
      method: "POST",
      url: "{{baseUrl}}/post",
      header: [],
      body: {
        mode: "raw",
        raw: '{"message":"hello"}',
        options: { raw: { language: "json" } },
      },
    },
    event: [
      {
        listen: "test",
        script: {
          type: "text/javascript",
          exec: [
            'pm.test("Status is 200", () => pm.response.to.have.status(200));',
          ],
        },
      },
    ],
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
export const DEFAULT_SOCKETIO_MESSAGE = {
  name: i18next.t("supplement.msg"),
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

// socketio default request parameters
export const DEFAULT_SOCKETIO_DATA: SocketIoDetailsData = {
  ...DEFAULT_APIS_BASE_DATA,
  name: i18next.t("supplement.new_socketio"),
  kind: APIS_TARGET_TYPE_ENUM.SOCKETIO,
  method: "",
  request: DEFAULT_SOCKETIO_REQUEST,
  message: [DEFAULT_SOCKETIO_MESSAGE],
  url: "",
  description: "",
  attribute_info: {},
  tags: [],
  config: {
    reconnect_num: 5,
    reconnect_time: 5000,
    shake_hands_path: "/socket.io",
    shake_hands_timeout: 0,
    socket_version: "v4",
    certificate_verification: -1,
  },
};

export const DEFAULT_GRAPHQL_DATA = {
  ...DEFAULT_APIS_BASE_DATA,
  kind: APIS_TARGET_TYPE_ENUM.GRAPHQL,
  name: "GraphQL Request",
  request: {
    method: "POST",
    url: "",
    header: [],
    body: { mode: "graphql", graphql: { query: "", variables: "{}" } },
  },
  event: [],
  response: [],
};
