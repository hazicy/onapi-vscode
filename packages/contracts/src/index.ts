import type {
  PostmanCollection,
  HttpProjectConfig,
  EnvironmentScope,
  SerializedCookieJar,
} from "@onapi/domain";
import type { RequestDefinition, ResponseDefinition } from "postman-collection";

export const REQUEST_EXECUTION_EVENT = "requestExecutionEvent" as const;
export type ExecutionError = {
  name?: string;
  message: string;
  code?: string;
  stack?: string;
};
export type SerializedResponse = ResponseDefinition & {
  stream?: { type: "Buffer"; data: number[] };
  responseTime?: number;
  responseSize?: number;
};
export interface ExecutionAssertion {
  assertion?: string;
  name?: string;
  error?: ExecutionError | null;
  skipped?: boolean;
}
export type ExecutionEvent = {
  type:
    | "start"
    | "beforeItem"
    | "request"
    | "responseData"
    | "console"
    | "assertion"
    | "exception"
    | "prerequest"
    | "test"
    | "item"
    | "done";
  error?: ExecutionError | null;
  cursor?: unknown;
  environment?: EnvironmentScope;
  globals?: HttpProjectConfig["options"]["globals"];
  cookieJar?: SerializedCookieJar;
  cookies?: unknown;
  assertions?: ExecutionAssertion[];
  messages?: unknown[];
  level?: keyof typeof console;
  timestamp?: number;
  visualizer?: string;
  request?: RequestDefinition;
  response?: SerializedResponse;
  [key: string]: unknown;
};
export type WorkerRunCommand = {
  collection: PostmanCollection;
  options: HttpProjectConfig["options"] & {
    environment?: HttpProjectConfig["environments"][number];
  };
};

export * from "./execution";

export * from "./testing";
