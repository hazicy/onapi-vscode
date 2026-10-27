import type { ExecutionEvent, ExecutionError } from "./index";

export const PROTOCOL_EXECUTION_EVENT = "protocolExecutionEvent" as const;
export type ExecutionProtocol = "http" | "websocket" | "socketio";
export type ProtocolEventType =
  | "runtime.event"
  | "response.received"
  | "response.chunk"
  | "assertion.completed"
  | "connection.opened"
  | "connection.closed"
  | "message.received"
  | "message.sent"
  | "ack.received"
  | "subscriptions.updated"
  | "execution.error";

export interface WebSocketResult {
  isSuccess: boolean;
  type: "connection" | "message" | "send" | "error" | "close";
  message: string;
  /** Detected payload MIME type, when known. Rendering belongs to the consumer. */
  contentType?: string;
  data?: unknown;
  time: string;
  dataType: string;
  size: string;
}

export interface SocketIoResult {
  isSuccess: boolean;
  type:
    | "connect"
    | "connect_error"
    | "disconnect"
    | "message"
    | "send"
    | "send_ack"
    | "error";
  message: string | { event: string; data: unknown };
  time: string;
  dataType: string;
  size: string;
  actualRequestParas?: {
    url: string;
    request: { headers: Record<string, string>; query: Record<string, string> };
  };
}

export type ProtocolEvent =
  | { protocol: "http"; type: ProtocolEventType; native: ExecutionEvent }
  | { protocol: "websocket"; type: ProtocolEventType; result: WebSocketResult }
  | { protocol: "socketio"; type: ProtocolEventType; result: SocketIoResult }
  | {
      protocol: "socketio";
      type: "subscriptions.updated";
      subscriptions: { addedEvents: string[]; removedEvents: string[] };
    }
  | {
      protocol: ExecutionProtocol;
      type: "session.started" | "execution.completed" | "session.closed";
      failed: boolean;
    }
  | {
      protocol: ExecutionProtocol;
      type: "execution.error";
      error: ExecutionError;
    };

export interface ExecutionEnvelope {
  protocolVersion: 1;
  sessionId: string;
  targetId?: string;
  sequence: number;
  timestamp: number;
  event: ProtocolEvent;
}
export interface ProtocolExecutionMessage {
  action: typeof PROTOCOL_EXECUTION_EVENT;
  data: ExecutionEnvelope;
}
