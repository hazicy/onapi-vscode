import { useEffect, useRef, useState } from "react";
import type { ExecutionEnvelope } from "@onapi/contracts";
import type { RequestPanelCommandInput } from "@onapi/contracts/request-panel";
import {
  readRequestPanelResponse,
  sendRequestPanelMessage,
} from "@/shared/bridge/request-panel";

type Command = Extract<
  RequestPanelCommandInput,
  { action: "ai_send" | "mcp_connect" | "mcp_request" }
>;
type Pending = { id: string; sequence: number; command: Command };

/** Commands and host validation failures use the same correlation identity. */
export function useProtocolExecution(
  targetId: string,
  onEvent: (event: ExecutionEnvelope) => void,
) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const active = useRef<Pending | undefined>(undefined);
  const connection = useRef<Pending | undefined>(undefined);
  const callback = useRef(onEvent);
  callback.current = onEvent;
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const message = readRequestPanelResponse(event.data);
      if (
        message?.action === "requestPanelError" &&
        message.requestId === active.current?.id
      ) {
        setError(message.data.error.message);
        setBusy(false);
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
        envelope.sessionId === active.current?.id
          ? active.current
          : envelope.sessionId === connection.current?.id
            ? connection.current
            : undefined;
      if (!pending || envelope.sequence <= pending.sequence) {
        return;
      }
      pending.sequence = envelope.sequence;
      const type = envelope.event.type;
      if (type === "execution.error" && "error" in envelope.event) {
        setError(envelope.event.error.message);
      }
      callback.current(envelope);
      if (
        type === "connection.opened" &&
        pending.command.action === "mcp_connect"
      ) {
        connection.current = pending;
        active.current = undefined;
        setBusy(false);
      }
      if (type === "execution.completed" && active.current === pending) {
        active.current = undefined;
        setBusy(false);
      }
      if (type === "session.closed" && connection.current === pending) {
        connection.current = undefined;
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [targetId]);
  const start = (build: (requestId: string) => Command) => {
    try {
      const id = crypto.randomUUID();
      const command = build(id);
      active.current = { id, sequence: 0, command };
      setError("");
      setBusy(true);
      sendRequestPanelMessage(command);
      return id;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return undefined;
    }
  };
  return { busy, error, setError, start, activeId: () => active.current?.id };
}
