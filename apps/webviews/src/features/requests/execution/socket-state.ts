import { receiveSessionEvent, type ExecutionSession } from "./session";
import type {
  ExecutionEnvelope,
  SocketIoResult,
  WebSocketResult,
} from "@onapi/contracts";

export type ConnectionStatus = "connect" | "connecting" | "disconnect";
export type SocketTimelineEntry = {
  action?:
    | WebSocketResult["type"]
    | SocketIoResult["type"]
    | "listen"
    | "listen-end";
  message?: unknown;
};
export type SocketConnection = {
  session?: ExecutionSession;
  socketRes: SocketTimelineEntry[];
  responseData?: Record<string, unknown> & {
    response?: Record<string, unknown>;
  };
};

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Reduce socket payloads after the shared session accepts the event. */
export function reduceSocketExecutionEvent(
  current: SocketConnection | undefined,
  envelope: ExecutionEnvelope,
): SocketConnection | undefined {
  const { event } = envelope;
  if (
    envelope.protocolVersion !== 1 ||
    (event.protocol !== "websocket" && event.protocol !== "socketio")
  ) {
    return current;
  }
  const session = receiveSessionEvent(current?.session, envelope);
  if (!session || session === current?.session) {
    return current;
  }
  const initial: SocketConnection = current ?? { socketRes: [] };
  const next = reduceSocketData(initial, envelope);
  return { ...next, session };
}

/** Socket messages, subscriptions and handshake data only. */
function reduceSocketData(
  current: SocketConnection,
  envelope: ExecutionEnvelope,
): SocketConnection {
  const { event } = envelope;
  const next = { ...current };
  if ("result" in event) {
    const result = event.result;
    const opened = event.type === "connection.opened";
    const closed = result.type === "close" || result.type === "disconnect";
    const failedConnection =
      (result.type === "connection" || result.type === "connect_error") &&
      !result.isSuccess;
    if (opened && result.isSuccess) {
      const handshake =
        event.protocol === "websocket"
          ? event.result.data
          : event.result.actualRequestParas;
      next.responseData = record(handshake)
        ? {
            ...handshake,
            ...(record(handshake.response)
              ? { response: handshake.response }
              : {}),
          }
        : undefined;
    }
    const fitForShow =
      event.protocol === "websocket" && event.result.contentType
        ? event.result.contentType.startsWith("image/")
          ? "Image"
          : "Other"
        : "Monaco";
    next.socketRes = [
      ...current.socketRes,
      {
        action: closed
          ? result.isSuccess
            ? "disconnect"
            : "error"
          : failedConnection
            ? "error"
            : opened
              ? "connect"
              : result.type,
        message: { ...result, fitForShow },
      },
    ];
  } else if ("subscriptions" in event) {
    next.socketRes = [
      ...current.socketRes,
      ...event.subscriptions.removedEvents.map((message) => ({
        action: "listen-end" as const,
        message,
      })),
      ...event.subscriptions.addedEvents.map((message) => ({
        action: "listen" as const,
        message,
      })),
    ];
  } else if ("error" in event) {
    next.socketRes = [
      ...current.socketRes,
      {
        action: "error",
        message: {
          type: "error",
          isSuccess: false,
          message: event.error.message,
        },
      },
    ];
  }
  return next;
}

/** UI connection labels are derived, never a second lifecycle state. */
export function getSocketConnectionStatus(
  connection?: SocketConnection,
): ConnectionStatus {
  return connection?.session?.status === "running"
    ? connection.session.opened
      ? "connect"
      : "connecting"
    : "disconnect";
}
