import type {
  ExecutionEvent,
  ExecutionError,
  ExecutionAssertion,
  SerializedResponse,
} from "@onapi/contracts";

export type HttpExecutionStatus =
  | "idle"
  | "sending"
  | "succeeded"
  | "failed"
  | "cancelled";
export interface HttpExecutionResult {
  executionId: string;
  response: SerializedResponse;
  request?: import("postman-collection").RequestDefinition;
  cookies?: unknown;
  visualizerHtml?: string | null;
}
export interface HttpExecutionState {
  status: HttpExecutionStatus;
  executionId?: string;
  sequence?: number;
  result?: HttpExecutionResult;
  error?: ExecutionError | null;
  events?: ExecutionEvent[];
  consoleList?: ExecutionEvent[];
  assertions?: ExecutionAssertion[];
}
export type HttpExecutionAction =
  | { type: "begin"; executionId: string }
  | { type: "cancel"; executionId: string }
  | {
      type: "event";
      executionId: string;
      sequence: number;
      event: ExecutionEvent;
    };

// The UI owns execution identity; old display data never defines execution state.
export function reduceHttpExecutionEvent(
  previous: HttpExecutionState | undefined,
  action: HttpExecutionAction,
): HttpExecutionState {
  const current = previous || { status: "idle" };
  if (action.type === "begin") {
    return {
      status: "sending",
      executionId: action.executionId,
      sequence: 0,
      result: current.result,
      error: null,
      events: [],
      consoleList: [],
      assertions: [],
    };
  }
  if (
    current.status !== "sending" ||
    current.executionId !== action.executionId
  ) {
    return current;
  }
  if (action.type === "cancel") {
    return { ...current, status: "cancelled" };
  }
  if (action.sequence <= (current.sequence || 0)) {
    return current;
  }
  const event = action.event;
  const next = {
    ...current,
    sequence: action.sequence,
    events: [...(current.events || []), event],
  };
  switch (event.type) {
    case "request":
      return {
        ...next,
        result: event.response
          ? {
              executionId: action.executionId,
              response: event.response,
              request: event.request,
              cookies: event.cookies,
              visualizerHtml: null,
            }
          : current.result,
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
      return event.visualizer &&
        current.result?.executionId === current.executionId
        ? {
            ...next,
            result: { ...current.result, visualizerHtml: event.visualizer },
          }
        : next;
    case "done": {
      const error = event.error || current.error;
      return { ...next, status: error ? "failed" : "succeeded", error };
    }
    default:
      return next;
  }
}
export function hasCompletedResponse(state?: HttpExecutionState): boolean {
  return (
    state?.status === "succeeded" &&
    !!state.result &&
    state.result.executionId === state.executionId
  );
}
