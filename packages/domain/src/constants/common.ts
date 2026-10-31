export const ALL_KEY = "all";

export enum STATUS_CODE {
  ENABLE = 1,
  DISABLE = -1,
}

export const VARIABLE_LIST_CONTENT_KEY = "variable-list-content-key";

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
};

// Type to text mapping

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

// Share status

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

// Default tab options for new/open API

// Request methods
export const GRPC_METHODS: string[] = ["gRPC", "gRPC TLS"];

export const TCP_METHODS: string[] = ["TCP"];
// ['Raw', 'Socket.IO', 'SockJs'];

export const WEBSOCKET_METHODS: string[] = ["Raw", "Socket.IO"];

export const METHODS_MAP: Record<string, string[]> = {
  api: API_METHODS,
  grpc: GRPC_METHODS,
  tcp: TCP_METHODS,
  websocket: WEBSOCKET_METHODS,
};

// Request method colors

// Request content types

// Request content types

// OpenAPI request types

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

// HTTP response status codes

/** Client close without prompt */

/** Client download URL */
