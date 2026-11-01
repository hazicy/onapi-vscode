import type { ExecutionEnvelope, ExecutionEvent } from "@onapi/contracts";

export interface ExecutionViews {
  http(event: ExecutionEvent, executionId: string, sequence: number): void;
  websocket(event: ExecutionEnvelope): void;
  socketio(event: ExecutionEnvelope): void;
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
  } else if (event.protocol === "websocket" || event.protocol === "socketio") {
    views[event.protocol](envelope);
  }
}
