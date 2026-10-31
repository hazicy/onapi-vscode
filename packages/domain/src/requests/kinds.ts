/** Canonical request kinds, shared by schemas, defaults and protocol menus. */
export const APIS_TARGET_TYPE_ENUM = {
  API: "api",
  FOLDER: "folder",
  DOC: "doc",
  GRPC: "grpc",
  API_SAMPLE: "sample",
  API_SAMPLE_GROUP: "sample_group",
  SOCKET: "socket",
  SOCKET_METHOD: "socket_method",
  WEBSOCKET: "websocket",
  SOCKETIO: "socketio",
  GRAPHQL: "graphql",
  AI: "ai",
  MCP: "mcp",
  SOCKET_SERVICE: "socket_service",
} as const;
export type APIS_TARGET_TYPE_ENUM =
  (typeof APIS_TARGET_TYPE_ENUM)[keyof typeof APIS_TARGET_TYPE_ENUM];
export const requestKinds = Object.values(APIS_TARGET_TYPE_ENUM);
