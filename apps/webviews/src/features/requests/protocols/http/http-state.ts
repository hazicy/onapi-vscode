import { reduceSession, type ExecutionSession } from "../../execution/session";
import type {
  ExecutionEvent,
  ExecutionError,
  ExecutionAssertion,
  SerializedResponse,
} from "@onapi/contracts";

export interface HttpExecutionResult {
  executionId: string;
  response: SerializedResponse;
  request?: import("postman-collection").RequestDefinition;
  cookies?: unknown;
  visualizerHtml?: string | null;
}
export interface HttpExecutionState {
  session?: ExecutionSession;
  result?: HttpExecutionResult;
  error?: ExecutionError | null;
  events?: ExecutionEvent[];
  consoleList?: ExecutionEvent[];
  assertions?: ExecutionAssertion[];
}
export type HttpExecutionAction =
  | { type: "begin"; executionId: string }
  | { type: "cancel"; executionId: string }
  | { type: "failure"; executionId: string; error: ExecutionError }
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
  const current = previous || {};
  const event = action.type === "event" ? action.event : undefined;
  const session = reduceSession(
    current.session,
    action.type === "begin"
      ? action
      : action.type === "cancel" || action.type === "failure"
        ? {
            type: "finish",
            executionId: action.executionId,
            status: action.type === "cancel" ? "cancelled" : "failed",
          }
        : {
            type: "event",
            executionId: action.executionId,
            sequence: action.sequence,
            failed: !!action.event.error,
            terminal: action.event.type === "done" ? "succeeded" : undefined,
          },
  );
  if (session === current.session) {
    return current;
  }
  if (action.type === "begin") {
    return {
      session,
      result: current.result,
      error: null,
      events: [],
      consoleList: [],
      assertions: [],
    };
  }
  if (action.type === "failure") {
    return { ...current, session, error: action.error };
  }
  if (!event) {
    return { ...current, session };
  }
  return reduceHttpData(
    current,
    { ...current, session, events: [...(current.events || []), event] },
    event,
    action.executionId,
  );
}

/** HTTP payload handling has no authority over execution lifecycle. */
function reduceHttpData(
  current: HttpExecutionState,
  next: HttpExecutionState,
  event: ExecutionEvent,
  executionId: string,
): HttpExecutionState {
  switch (event.type) {
    case "responseStart":
    case "request":
      return {
        ...next,
        result: event.response
          ? {
              executionId,
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
        current.result &&
        current.result.executionId === current.session?.executionId
        ? {
            ...next,
            result: { ...current.result, visualizerHtml: event.visualizer },
          }
        : next;
    case "done": {
      const error = event.error || current.error;
      return {
        ...next,
        error,
      };
    }
    default:
      return next;
  }
}
export function hasCompletedResponse(state?: HttpExecutionState): boolean {
  return (
    state?.session?.status === "succeeded" &&
    !!state.result &&
    state.result.executionId === state.session.executionId
  );
}
