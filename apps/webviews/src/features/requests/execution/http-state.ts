import type {
  ExecutionEvent,
  ExecutionError,
  ExecutionAssertion,
  SerializedResponse,
} from "@onapi/contracts";

// UI state retains the Postman callback payloads without translating request models.
export interface HttpExecutionState {
  sendStatus?: "initial" | "sending" | "sendError";
  id?: string;
  timestamp?: number;
  message?: string;
  request?: import("postman-collection").RequestDefinition;
  response?: SerializedResponse;
  cookies?: unknown;
  error?: ExecutionError | null;
  events?: ExecutionEvent[];
  consoleList?: ExecutionEvent[];
  assertions?: ExecutionAssertion[];
  visualizerHtml?: string | null;
  streamResponse?: {
    action: string;
    id: string;
    data: unknown;
    error?: unknown;
    msg?: string;
  }[];
}

export function reduceHttpExecutionEvent(
  previous: HttpExecutionState | undefined,
  event: ExecutionEvent,
): HttpExecutionState {
  const current = event.type === "start" ? {} : previous || {};
  const next = {
    ...current,
    events: [...(current.events || []), event],
  };

  switch (event.type) {
    case "start":
      return {
        ...next,
        sendStatus: "sending",
        consoleList: [],
        assertions: [],
      };
    case "request":
      return {
        ...next,
        response: event.response,
        request: event.request,
        cookies: event.cookies,
        error: event.error,
      };
    case "console":
      return { ...next, consoleList: [...(current.consoleList || []), event] };
    case "assertion":
      return {
        ...next,
        assertions: [
          ...(current.assertions || []),
          ...(Array.isArray(event.assertions) ? event.assertions : []),
        ],
      };
    case "exception":
      return { ...next, error: event.error };
    case "item":
      return event.visualizer
        ? { ...next, visualizerHtml: event.visualizer }
        : next;
    case "done": {
      const error = event.error || current.error;
      return {
        ...next,
        sendStatus: error ? "sendError" : "initial",
        error,
        message: error?.message,
      };
    }
    default:
      return next;
  }
}
