import { RequestBodyContentType } from "@onapi/domain/requests/types/request";

/**
 * API sending data
 */
export interface ApiSendingData {
  /**Send status */
  sendStatus: "initial" | "sending" | "sendError";
  /**Data timestamp */
  timestamp: number;
  /**Error message */
  message: string;
  /**Original error info */
  responseError: ApiSendResponseError;
  /**Request headers */
  requestHeaders: ApiSendResponseDataRequest["headers"];
  /**Response headers */
  responseHeaders: ApiSendResponseDataResponse["headers"];
  /**cookies */
  cookies: ApiSendResponseDataResponse["arr_cookies"];
  /**Assertions */
  asserts: ApiSendResponseData["assertions"];
  /**Visualizer */
  visualizerHtml: string | null;
  /**target id*/
  id: string;
  /**Console log list */
  consoleList: ApiSendResponseData["console"];
  /**Raw response of send result */
  response: Omit<ApiSendResponseDataResponse, "headers" | "arr_cookies">;
  /**Raw request of send result */
  request: ApiSendResponseDataRequest;
}

/**
 * Stream response data item
 */

/**
 * API send response data
 */

/**
 * API send response error
 */
export type ApiSendResponseError = {
  error_type: string;
  message: string;
} | null;

/**
 * API send response data
 */
export type ApiSendResponseData = {
  assertions: ApiSendResponseDataAssertionsItem[];
  console: ApiSendResponseDataConsoleItem[];
  request: ApiSendResponseDataRequest;
  response: ApiSendResponseDataResponse;
  variables: ApiSendResponseDataVariables;
  visualizer: ApiSendResponseDataVisualizer;
};

/**
 * API send response data assertions
 */
export type ApiSendResponseDataAssertionsItem = {
  async: boolean;
  error: {
    actual: boolean;
    expected: boolean;
    message: string;
    name: string;
    operator: string;
    showDiff: boolean;
    stack: string;
  } | null;
  index: number;
  name: string;
  passed: boolean;
  skipped: boolean;
};

/**
 * API send response data console
 */
export type ApiSendResponseDataConsoleItem = {
  level: keyof typeof console;
  args: any[];
  time: string;
};

/**
 * API send response data request
 */
export type ApiSendResponseDataRequest = {
  name: string;
  url: string;
  method: string;
  body?: string | { [x: string]: string | string[] };
  mode: RequestBodyContentType;
  project_id: string;
  uri:
    | {
        host: string;
        path: string;
        protocol: string;
        query: { key: string; value: string }[];
        variable: any[];
      }
    | string;
  cookies: { [x: string]: string | string[] };
  headers: { [x: string]: string | string[] };
  querys: { [x: string]: string | string[] };
  paths: { [x: string]: string | string[] };
  proxy?: ApiSendResponseDataProxy;
};

/**
 * API send response data variables
 */
export type ApiSendResponseDataVariables = {
  environment: { [x: string]: string };
  from: { event_id: string; id: string };
  globals: { [x: string]: string };
  variables: { [x: string]: string };
};

/**
 * API send response data visualizer
 */
export type ApiSendResponseDataVisualizer = {
  error: string | null;
  processed_template: string;
};

/**
 * API send response data response
 */
export type ApiSendResponseDataResponse = {
  arr_cookies: ApiSendResponseDataResponseArrCookiesItem[];
  body: string;
  code: number;
  cookies: { [x: string]: string | string[] };
  filename?: string;
  fit_for_show: string;
  headers: { [x: string]: string | string[] };
  id: string;
  mime_type: { ext: string; mime: string };
  proxy: ApiSendResponseDataProxy;
  request_start: number;
  response_size: number;
  response_time: number;
  response_at: number;
  status: string;
  stream?: {
    data: ArrayBuffer;
    type: string;
  };
  timings: {
    connect: number;
    done: number;
    end: number;
    lookup: number;
    request: number;
    response: number;
    secure_connect: number;
    socket: number;
  };
  raw_body?: string;
  formatTimings: {
    prepare: ApiSendResponseDataResponseFormatTimingsItem;
    socketInitialization: ApiSendResponseDataResponseFormatTimingsItem;
    dnsLookup: ApiSendResponseDataResponseFormatTimingsItem;
    tcpHandshake: ApiSendResponseDataResponseFormatTimingsItem;
    sslHandshake: ApiSendResponseDataResponseFormatTimingsItem;
    waiting: ApiSendResponseDataResponseFormatTimingsItem;
    process: ApiSendResponseDataResponseFormatTimingsItem;
    download: {
      duration: number;
    };
    total: {
      duration: number;
    };
  };
  network: {
    HTTPVersion: string;
    Proxy: string;
    LocalAddress: string;
    RemoteAddress: string;
    TLSProtocol: string;
    CipherCountry: string;
    CipherName: string;
    ValidUntil: string;
    Certificate: string;
    Issuer: string;
  };
  formatSize: {
    requestHeaders: number;
    responseHeaders: number;
    requestBody: number;
    responseBody: number;
    uncompressedResponseBody?: number;
  };
};

/**
 * API send response data response arr_cookies
 */
export type ApiSendResponseDataResponseArrCookiesItem = {
  cookie_id: string;
  project_id?: string;
  creation: string;
  domain?: string;
  expires?: string | Date;
  expiratioxnDate?: string | Date;
  httpOnly?: boolean;
  key: string;
  maxAge?: number;
  name: string;
  path?: string;
  value: string;
};

/**
 * API send response data response proxy
 */
export type ApiSendResponseDataProxy = {
  authenticate: boolean;
  host: string;
  id: string;
  match: { pattern: string; [x: string]: any };
  port: number;
  tunnel: boolean;
  href?: string;
};

export type ApiSendResponseDataResponseFormatTimingsItem = {
  duration: number;
  width: number;
  level: string;
};
