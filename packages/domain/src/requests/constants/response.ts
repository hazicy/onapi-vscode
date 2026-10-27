import i18next from "i18next";

import { ExpectItem } from "@onapi/domain/requests/types/base";
import { BaseResponse } from "@onapi/domain/requests/types/response";
import { HttpStatusCode } from "@onapi/domain/types/common";

export const DEFAULT_RESPONSE = {
  example_id: "1",
  raw: "",
  raw_parameter: [],
  expect: {
    name: i18next.t("supplement.default"),
    is_default: -1 as ExpectItem["is_default"],
    code: "200" as HttpStatusCode,
    content_type: "json" as ExpectItem["content_type"],
    verify_type: "schema" as ExpectItem["verify_type"],
    schema: {
      type: "object",
      properties: {},
    },
  },
};

export const SUCCESS_RESPONSE = {
  ...DEFAULT_RESPONSE,
  example_id: "1",
  expect: {
    ...DEFAULT_RESPONSE.expect,
    name: i18next.t("supplement.success"),
    is_default: 1 as ExpectItem["is_default"],
    code: "200" as HttpStatusCode,
  },
};

export const ERROR_RESPONSE = {
  ...DEFAULT_RESPONSE,
  example_id: "2",
  expect: {
    ...DEFAULT_RESPONSE.expect,
    name: i18next.t("supplement.failed"),
    is_default: -1 as ExpectItem["is_default"],
    code: "404" as HttpStatusCode,
  },
};

export const DEFAULT_API_RESPONSE: BaseResponse = {
  is_check_result: 1,
  example: [SUCCESS_RESPONSE, ERROR_RESPONSE],
};

export const RESPONSE_CODE_DESC_MAP = {
  100: {
    name: "Continue",
    desc: i18next.t("response.100"),
  },
  101: {
    name: "Switching Protocols",
    desc: i18next.t("response.101"),
  },
  102: {
    name: "Processing (WebDAV)",
    desc: i18next.t("response.102"),
  },
  103: {
    name: "Early Hints",
    desc: i18next.t("response.103"),
  },
  200: {
    name: "OK",
    desc: i18next.t("response.200"),
  },
  201: {
    name: "Created",
    desc: i18next.t("response.201"),
  },
  202: {
    name: "Accepted",
    desc: i18next.t("response.202"),
  },
  203: {
    name: "Non-Authoritative Information",
    desc: i18next.t("response.203"),
  },
  204: {
    name: "No Content",
    desc: i18next.t("response.204"),
  },
  205: {
    name: "Reset Content",
    desc: i18next.t("response.205"),
  },
  206: {
    name: "Partial Content",
    desc: i18next.t("response.206"),
  },
  207: {
    name: "Multi-Status (WebDAV)",
    desc: i18next.t("response.207"),
  },
  208: {
    name: "Already Reported (WebDAV)",
    desc: i18next.t("response.208"),
  },
  226: {
    name: "IM Used",
    desc: i18next.t("response.226"),
  },
  300: {
    name: "Multiple Choices",
    desc: i18next.t("response.300"),
  },
  301: {
    name: "Moved Permanently",
    desc: i18next.t("response.301"),
  },
  302: {
    name: "Found",
    desc: i18next.t("response.302"),
  },
  303: {
    name: "See Other",
    desc: i18next.t("response.303"),
  },
  304: {
    name: "Not Modified",
    desc: i18next.t("response.304"),
  },
  305: {
    name: "Use Proxy",
    desc: i18next.t("response.305"),
  },
  307: {
    name: "Temporary Redirect",
    desc: i18next.t("response.307"),
  },
  308: {
    name: "Permanent Redirect",
    desc: i18next.t("response.308"),
  },
  400: {
    name: "Bad Request",
    desc: i18next.t("response.400"),
  },
  401: {
    name: "Unauthorized",
    desc: i18next.t("response.401"),
  },
  402: {
    name: "Payment Required",
    desc: i18next.t("response.402"),
  },

  403: {
    name: "Forbidden",
    desc: i18next.t("response.403"),
  },
  404: {
    name: "Not Found",
    desc: i18next.t("response.404"),
  },
  405: {
    name: "Method Not Allowed",
    desc: i18next.t("response.405"),
  },
  406: {
    name: "Not Acceptable",
    desc: i18next.t("response.406"),
  },
  407: {
    name: "Proxy Authentication Required",
    desc: i18next.t("response.407"),
  },
  408: {
    name: "Request Timeout",
    desc: i18next.t("response.408"),
  },
  409: {
    name: "Conflict",
    desc: i18next.t("response.409"),
  },
  410: {
    name: "Gone",
    desc: i18next.t("response.410"),
  },
  411: {
    name: "Length Required",
    desc: i18next.t("response.411"),
  },
  412: {
    name: "Precondition Failed",
    desc: i18next.t("response.412"),
  },
  413: {
    name: "Payload Too Large",
    desc: i18next.t("response.413"),
  },
  414: {
    name: "URI Too Long",
    desc: i18next.t("response.414"),
  },
  415: {
    name: "Unsupported Media Type",
    desc: i18next.t("response.415"),
  },
  416: {
    name: "Range Not Satisfiable",
    desc: i18next.t("response.416"),
  },
  417: {
    name: "Expectation Failed",
    desc: i18next.t("response.417"),
  },
  418: {
    name: "I'm a teapot",
    desc: i18next.t("response.418"),
  },

  421: {
    name: "Misdirected Request",
    desc: i18next.t("response.421"),
  },
  422: {
    name: "Unprocessable Entity (WebDAV)",
    desc: i18next.t("response.422"),
  },
  423: {
    name: "Locked (WebDAV)",
    desc: i18next.t("response.423"),
  },
  424: {
    name: "Failed Dependency (WebDAV)",
    desc: i18next.t("response.424"),
  },
  425: {
    name: "Too Early",
    desc: i18next.t("response.425"),
  },
  426: {
    name: "Upgrade Required",
    desc: i18next.t("response.426"),
  },
  428: {
    name: "Precondition Required",
    desc: i18next.t("response.428"),
  },
  429: {
    name: "Too Many Requests",
    desc: i18next.t("response.429"),
  },
  431: {
    name: "Request Header Fields Too Large",
    desc: i18next.t("response.431"),
  },
  451: {
    name: "Unavailable For Legal Reasons",
    desc: i18next.t("response.451"),
  },
  500: {
    name: "Internal Server Error",
    desc: i18next.t("response.500"),
  },
  501: {
    name: "Not Implemented",
    desc: i18next.t("response.501"),
  },

  502: {
    name: "Bad Gateway",
    desc: i18next.t("response.502"),
  },
  503: {
    name: "Service Unavailable",
    desc: i18next.t("response.503"),
  },
  504: {
    name: "Gateway Timeout",
    desc: i18next.t("response.504"),
  },
  505: {
    name: "HTTP Version Not Supported",
    desc: i18next.t("response.505"),
  },
  506: {
    name: "Variant Also Negotiates",
    desc: i18next.t("response.506"),
  },
  507: {
    name: "Insufficient Storage (WebDAV)",
    desc: i18next.t("response.507"),
  },
  508: {
    name: "Loop Detected (WebDAV)",
    desc: i18next.t("response.508"),
  },
  510: {
    name: "Not Extended",
    desc: i18next.t("response.510"),
  },
  511: {
    name: "Network Authentication Required",
    desc: i18next.t("response.511"),
  },
};

export const HTTP_TIME_ARRAY = [
  "prepare",
  "socketInitialization",
  "dnsLookup",
  "tcpHandshake",
  "waiting",
  "download",
  "process",
];

export const HTTPS_TIME_ARRAY = [
  "prepare",
  "socketInitialization",
  "dnsLookup",
  "tcpHandshake",
  "sslHandshake",
  "waiting",
  "download",
  "process",
];
