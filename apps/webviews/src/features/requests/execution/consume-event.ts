import type { ExecutionEnvelope, ExecutionEvent } from "@onapi/contracts";

export interface ExecutionViews {
  http(event: ExecutionEvent, executionId: string, sequence: number): void;
  websocket(event: { id?: string; action: string; message: unknown }): void;
  socketio(event: { id?: string; action: string; message: unknown }): void;
}

/** One event channel; each existing view retains its protocol-specific data. */
export function consumeExecutionEvent(
  envelope: ExecutionEnvelope,
  views: ExecutionViews,
) {
  if (envelope.protocolVersion !== 1) {
    return;
  }
  const event = envelope.event;
  if (event.protocol === "http" && "native" in event) {
    views.http(event.native, envelope.sessionId, envelope.sequence);
  } else if (event.protocol === "http" && event.type === "execution.error") {
    views.http(
      { type: "done", error: event.error },
      envelope.sessionId,
      envelope.sequence,
    );
  } else if (event.protocol !== "http" && "result" in event) {
    const action =
      event.type === "connection.opened"
        ? "connected"
        : event.result.type === "connection" ||
            event.result.type === "connect_error"
          ? "error"
          : "received";
    views[event.protocol]({
      id: envelope.targetId,
      action,
      message: {
        ...event.result,
        fitForShow:
          event.protocol === "websocket" && event.result.contentType
            ? event.result.contentType.startsWith("image/")
              ? "Image"
              : "Other"
            : "Monaco",
      },
    });
  } else if (event.protocol !== "http" && "error" in event) {
    views[event.protocol]({
      id: envelope.targetId,
      action: "error",
      message: {
        type: "error",
        isSuccess: false,
        message: event.error.message,
      },
    });
  } else if (event.protocol === "socketio" && "subscriptions" in event) {
    views.socketio({
      id: envelope.targetId,
      action: "updateEvent",
      message: event.subscriptions,
    });
  }
}

/** Discard duplicate, out-of-order and replaced-session events before touching view state. */
export function createExecutionConsumer() {
  const active = new Map<string, { sessionId: string; sequence: number }>();
  return (envelope: ExecutionEnvelope, views: ExecutionViews) => {
    if (envelope.protocolVersion !== 1) {
      return;
    }
    // HTTP identity and sequence are checked together by its state reducer.
    if (envelope.event.protocol === "http") {
      consumeExecutionEvent(envelope, views);
      return;
    }
    const key = `${envelope.event.protocol}:${envelope.targetId || ""}`;
    let current = active.get(key);
    if (envelope.event.type === "session.started") {
      if (current?.sessionId === envelope.sessionId) {
        return;
      }
      current = { sessionId: envelope.sessionId, sequence: 0 };
      active.set(key, current);
    }
    if (
      !current ||
      current.sessionId !== envelope.sessionId ||
      envelope.sequence <= current.sequence
    ) {
      return;
    }
    current.sequence = envelope.sequence;
    consumeExecutionEvent(envelope, views);
  };
}
