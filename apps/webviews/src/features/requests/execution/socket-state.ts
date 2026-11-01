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
  status: ConnectionStatus;
  requestId?: string;
  sessionId?: string;
  sequence?: number;
  closed?: boolean;
  socketRes: SocketTimelineEntry[];
  responseData?: Record<string, unknown> & {
    response?: Record<string, unknown>;
  };
};

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Session correlation and protocol transitions live with the state they protect. */
export function reduceSocketExecutionEvent(
  current: SocketConnection | undefined,
  envelope: ExecutionEnvelope,
): SocketConnection | undefined {
  const { event, sessionId, sequence } = envelope;
  if (
    envelope.protocolVersion !== 1 ||
    (event.protocol !== "websocket" && event.protocol !== "socketio")
  ) {
    return current;
  }
  if (event.type === "session.started") {
    if (
      current?.closed ||
      current?.sessionId === sessionId ||
      (current?.requestId && current.requestId !== sessionId) ||
      (current?.sessionId && !current.requestId)
    ) {
      return current;
    }
    return {
      ...current,
      status: "connecting",
      sessionId,
      sequence,
      closed: false,
      socketRes: current?.socketRes ?? [],
    };
  }
  if (
    !current ||
    current.closed ||
    current.sessionId !== sessionId ||
    sequence <= (current.sequence ?? 0)
  ) {
    return current;
  }
  const next = { ...current, sequence };
  if ("result" in event) {
    const result = event.result;
    const opened = event.type === "connection.opened";
    const closed = result.type === "close" || result.type === "disconnect";
    const failedConnection =
      (result.type === "connection" || result.type === "connect_error") &&
      !result.isSuccess;
    next.status =
      closed || failedConnection
        ? "disconnect"
        : result.type === "error"
          ? current.status
          : "connect";
    next.requestId = undefined;
    next.closed = closed || failedConnection;
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
    next.status = "disconnect";
    next.requestId = undefined;
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
  } else if (
    event.type === "session.closed" ||
    event.type === "execution.completed" ||
    event.type === "execution.cancelled"
  ) {
    next.status = "disconnect";
    next.requestId = undefined;
    next.closed = true;
  }
  return next;
}
