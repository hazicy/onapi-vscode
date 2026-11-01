import {
  beginSession,
  acceptsSession,
  reduceSession,
  receiveSessionEvent,
  type ExecutionSession,
} from "../../execution/session";
import { useEffect, useRef, useState } from "react";
import type { ExecutionEnvelope } from "@onapi/contracts";
import type { RequestPanelCommandInput } from "@onapi/contracts/request-panel";
import {
  readRequestPanelResponse,
  sendRequestPanelMessage,
} from "@/shared/bridge/request-panel";

type Command = Extract<
  RequestPanelCommandInput,
  {
    action:
      | "ai_send"
      | "mcp_connect"
      | "mcp_request"
      | "grpc_discover"
      | "grpc_invoke";
  }
>;
type Pending = { session: ExecutionSession; command: Command };

/** Commands and host validation failures use the same correlation identity. */
export function useProtocolExecution(
  targetId: string,
  onEvent: (event: ExecutionEnvelope) => void,
) {
  const [, refresh] = useState(0);
  const [error, setError] = useState("");
  const active = useRef<Pending | undefined>(undefined);
  const connection = useRef<Pending | undefined>(undefined);
  const callback = useRef(onEvent);
  callback.current = onEvent;
  useEffect(() => {
    refresh((revision) => revision + 1);
    setError("");
    const listener = (event: MessageEvent) => {
      const message = readRequestPanelResponse(event.data);
      if (
        message?.action === "requestPanelError" &&
        acceptsSession(active.current?.session, message.requestId ?? "")
      ) {
        setError(message.data.error.message);
        refresh((revision) => revision + 1);
        if (active.current) {
          active.current.session = reduceSession(active.current.session, {
            type: "finish",
            executionId: active.current.session.executionId,
            status: "failed",
          })!;
        }
        active.current = undefined;
      }
      if (
        message?.action !== "protocolExecutionEvent" ||
        message.data.targetId !== targetId
      ) {
        return;
      }
      const envelope = message.data;
      const pending =
        envelope.sessionId === active.current?.session.executionId
          ? active.current
          : envelope.sessionId === connection.current?.session.executionId
            ? connection.current
            : undefined;
      const type = envelope.event.type;
      if (!pending) {
        return;
      }
      const session = receiveSessionEvent(pending.session, envelope);
      if (!session || session === pending.session) {
        return;
      }
      pending.session = session;
      if (type === "execution.error" && "error" in envelope.event) {
        setError(envelope.event.error.message);
      }
      if (
        type === "connection.opened" &&
        pending.command.action === "mcp_connect"
      ) {
        connection.current = pending;
        active.current = undefined;
        refresh((revision) => revision + 1);
      }
      if (session.status !== "running") {
        if (active.current === pending) {
          active.current = undefined;
          refresh((revision) => revision + 1);
        }
        if (connection.current === pending) {
          connection.current = undefined;
        }
      }
      callback.current(envelope);
    };
    window.addEventListener("message", listener);
    return () => {
      window.removeEventListener("message", listener);
      active.current = undefined;
      connection.current = undefined;
    };
  }, [targetId]);
  const start = (build: (requestId: string) => Command) => {
    try {
      const id = crypto.randomUUID();
      const command = build(id);
      active.current = { session: beginSession(id), command };
      setError("");
      refresh((revision) => revision + 1);
      sendRequestPanelMessage(command);
      return id;
    } catch (e) {
      if (active.current) {
        active.current.session = reduceSession(active.current.session, {
          type: "finish",
          executionId: active.current.session.executionId,
          status: "failed",
        })!;
      }
      active.current = undefined;
      refresh((revision) => revision + 1);
      setError(e instanceof Error ? e.message : String(e));
      return undefined;
    }
  };
  return {
    busy: active.current?.session.status === "running",
    error,
    setError,
    start,
    activeId: () => active.current?.session.executionId,
  };
}
