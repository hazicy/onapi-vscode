import type { ExecutionEnvelope } from "@onapi/contracts";

/** Shared identity, ordering and terminal-state rules; payloads belong to protocols. */
export type ExecutionSession = {
  started?: boolean;
  opened?: boolean;
  failed?: boolean;
  executionId: string;
  sequence: number;
  status: "running" | "succeeded" | "failed" | "cancelled";
};
export function beginSession(executionId: string): ExecutionSession {
  return { executionId, sequence: 0, status: "running" };
}
export function acceptsSession(
  session: ExecutionSession | undefined,
  executionId: string,
  sequence?: number,
): session is ExecutionSession {
  return (
    !!session &&
    session.status === "running" &&
    session.executionId === executionId &&
    (sequence === undefined ||
      (Number.isSafeInteger(sequence) && sequence > session.sequence))
  );
}
export function advanceSession(
  session: ExecutionSession | undefined,
  executionId: string,
  sequence: number,
): ExecutionSession | undefined {
  return acceptsSession(session, executionId, sequence)
    ? { ...session, sequence }
    : undefined;
}
export function finishSession(
  session: ExecutionSession,
  status: Exclude<ExecutionSession["status"], "running">,
): ExecutionSession {
  return session.status === "running" ? { ...session, status } : session;
}

export type SessionAction =
  | { type: "begin"; executionId: string }
  | { type: "open"; executionId: string }
  | {
      type: "event";
      executionId: string;
      sequence: number;
      started?: boolean;
      opened?: boolean;
      failed?: boolean;
      terminal?: "succeeded" | "failed" | "cancelled";
    }
  | {
      type: "finish";
      executionId: string;
      status: "succeeded" | "failed" | "cancelled";
    };

/** All callers use this transition, including local cancellation and host failures. */
export function reduceSession(
  current: ExecutionSession | undefined,
  action: SessionAction,
): ExecutionSession | undefined {
  if (action.type === "begin") {
    return beginSession(action.executionId);
  }
  if (action.type === "open") {
    return acceptsSession(current, action.executionId)
      ? { ...current, opened: true }
      : current;
  }
  if (action.type === "finish") {
    return acceptsSession(current, action.executionId)
      ? finishSession(current, action.status)
      : current;
  }
  const initial =
    current ?? (action.started ? beginSession(action.executionId) : undefined);
  if (action.started && initial?.started) {
    return current;
  }
  const next = advanceSession(initial, action.executionId, action.sequence);
  if (!next) {
    return current;
  }
  next.started = initial?.started || action.started;
  next.opened = initial?.opened || action.opened;
  next.failed = initial?.failed || action.failed;
  return action.terminal
    ? finishSession(
        next,
        action.terminal === "succeeded" && next.failed
          ? "failed"
          : action.terminal,
      )
    : next;
}

/** Normalize host lifecycle once; protocol reducers only consume accepted payloads. */
export function receiveSessionEvent(
  current: ExecutionSession | undefined,
  envelope: ExecutionEnvelope,
): ExecutionSession | undefined {
  if (envelope.protocolVersion !== 1) {
    return current;
  }
  const { event } = envelope;
  const socket =
    event.protocol === "websocket" || event.protocol === "socketio";
  const result = "result" in event ? event.result : undefined;
  const connectionFailed =
    socket &&
    !!result &&
    (result.type === "connection" || result.type === "connect_error") &&
    !result.isSuccess;
  const connectionClosed = event.type === "connection.closed";
  const fatal = socket && "error" in event;
  return reduceSession(current, {
    type: "event",
    executionId: envelope.sessionId,
    sequence: envelope.sequence,
    started: event.type === "session.started",
    opened:
      event.type === "connection.opened" && (!result || !!result.isSuccess),
    // Socket send errors carry a result and leave the connection usable.
    failed:
      connectionFailed ||
      fatal ||
      (event.type === "execution.error" && !socket) ||
      ("failed" in event && event.failed),
    terminal:
      event.type === "execution.cancelled"
        ? "cancelled"
        : connectionFailed || fatal
          ? "failed"
          : connectionClosed ||
              event.type === "execution.completed" ||
              event.type === "session.closed"
            ? "succeeded"
            : undefined,
  });
}
