import { io, type ManagerOptions, type SocketOptions } from "socket.io-client";
import JSON5 from "json5";
import {
  createVariableReplacer,
  prepareWebSocket,
  type WebSocketRuntimeOptions,
  type WebSocketTarget,
} from "../websocket/options";

export interface SocketEvent {
  key?: unknown;
  value?: unknown;
}
export interface SocketIoTarget extends WebSocketTarget {
  config?: WebSocketTarget["config"] & {
    socket_version?: string;
    shake_hands_path?: string;
    reconnect_num?: number;
    reconnect_time?: number;
  };
  request?: WebSocketTarget["request"] & {
    event?: { parameter?: SocketEvent[] };
  };
}

interface ClientSocket {
  connected: boolean;
  on(event: string, listener: (...args: any[]) => void): this;
  once(event: string, listener: (...args: any[]) => void): this;
  off(event: string, listener: (...args: any[]) => void): this;
  connect(): this;
  disconnect(): this;
  emit(event: string, ...args: any[]): this;
}

import type { SocketIoResult } from "@onapi/contracts";
export type { SocketIoResult } from "@onapi/contracts";

export class SocketIoConnectionError extends Error {
  readonly isSuccess = false;
  constructor(readonly result: SocketIoResult) {
    super(String(result.message));
    this.name = "SocketIoConnectionError";
  }
}

const reservedEvents = new Set([
  "connect",
  "connect_error",
  "connect_timeout",
  "disconnect",
  "disconnecting",
  "error",
  "newListener",
  "removeListener",
]);
function result(
  type: SocketIoResult["type"],
  message: SocketIoResult["message"],
  isSuccess = true,
  dataType = "text",
): SocketIoResult {
  const content =
    typeof message === "string" ? message : JSON.stringify(message);
  const size = Buffer.byteLength(content);
  return {
    type,
    message,
    isSuccess,
    time: new Date().toTimeString().slice(0, 8),
    dataType,
    size:
      size > 1024
        ? `${Math.round((size / 1024) * 100) / 100} kb`
        : `${size} byte`,
  };
}

export class SocketClient {
  private socket?: ClientSocket;
  private stopped = false;
  private started = false;
  private pendingConnect?: (error: Error) => void;
  private resolveClosed!: () => void;
  private readonly closed = new Promise<void>((resolve) => {
    this.resolveClosed = resolve;
  });
  private readonly listeners = new Map<string, (...args: any[]) => void>();
  private sending: Promise<void> = Promise.resolve();
  constructor(
    private readonly target: SocketIoTarget,
    private readonly options: WebSocketRuntimeOptions,
    private readonly callback: (message: SocketIoResult) => void,
  ) {}

  async connect(): Promise<SocketIoResult> {
    if (this.started) {
      throw new Error("Socket.IO client has already been started");
    }
    this.started = true;
    try {
      const prepared = await prepareWebSocket(this.target, this.options);
      if (this.stopped) {
        throw new Error("Socket.IO connection cancelled");
      }
      const url = new URL(prepared.url);
      url.protocol = url.protocol === "wss:" ? "https:" : "http:";
      const finalUrl = url.toString();
      const { rejectUnauthorized, ca, cert, key, pfx, passphrase, agent } =
        prepared.clientOptions;
      const connectionOptions: Partial<ManagerOptions & SocketOptions> = {
        autoConnect: false,
        forceNew: true,
        // Match the debugger's existing explicit-connect behavior.
        reconnection: false,
        tryAllTransports: true,
        path: this.target.config?.shake_hands_path?.trim() || "/socket.io",
        timeout:
          Number(this.target.config?.shake_hands_timeout) > 0
            ? Number(this.target.config?.shake_hands_timeout)
            : 20000,
        extraHeaders: prepared.headers,
      };
      // Engine.IO's declarations use browser-shaped TLS fields. Its Node
      // transports accept the Buffers and Agent validated by prepareWebSocket.
      Object.assign(connectionOptions, {
        rejectUnauthorized,
        ca,
        cert,
        key,
        pfx,
        passphrase,
        agent,
      });
      const socket = io(finalUrl, connectionOptions);
      this.socket = socket;
      return await new Promise<SocketIoResult>((resolve, reject) => {
        this.pendingConnect = reject;
        socket.once("connect", () => {
          this.pendingConnect = undefined;
          resolve({
            ...result("connect", `Connected to ${finalUrl}`),
            actualRequestParas: {
              url: finalUrl,
              request: { headers: prepared.headers, query: prepared.query },
            },
          });
        });
        const fail = (error: Error) => {
          const failure = new SocketIoConnectionError(
            result(
              "connect_error",
              `Connection error: ${error.message || error}`,
              false,
            ),
          );
          if (!this.pendingConnect && !this.stopped) {
            this.callback(failure.result);
          }
          this.pendingConnect?.(failure);
          this.pendingConnect = undefined;
          this.disconnect();
        };
        socket.on("connect_error", fail);
        socket.on("connect_timeout", fail);
        socket.on("error", fail);
        socket.once("disconnect", (reason: string) => {
          if (this.stopped) {
            return;
          }
          this.stopped = true;
          this.callback(result("disconnect", `Disconnected: ${reason}`));
          socket.disconnect();
          this.resolveClosed();
        });
        this.updateEvent(this.target.request?.event?.parameter || []);
        socket.connect();
      });
    } catch (error) {
      this.disconnect();
      if (error instanceof SocketIoConnectionError) {
        throw error;
      }
      throw new SocketIoConnectionError(
        result("connect_error", String(error), false),
      );
    }
  }

  get subscribedEvents(): string[] {
    return [...this.listeners.keys()];
  }

  updateEvent(parameters: SocketEvent[]) {
    const events = new Set(
      parameters
        .filter((item) => String(item.value) === "1")
        .map((item) => String(item.key || "").trim())
        .filter((event) => event && !reservedEvents.has(event)),
    );
    const removedEvents = [...this.listeners.keys()].filter(
      (event) => !events.has(event),
    );
    const addedEvents = [...events].filter(
      (event) => !this.listeners.has(event),
    );
    for (const event of removedEvents) {
      this.socket?.off(event, this.listeners.get(event)!);
      this.listeners.delete(event);
    }
    for (const event of addedEvents) {
      const listener = (...args: unknown[]) => {
        if (this.stopped) {
          return;
        }
        const values = args.filter((value) => typeof value !== "function");
        this.callback(
          result("message", {
            event,
            data: values.length > 1 ? values : values[0],
          }),
        );
      };
      this.listeners.set(event, listener);
      this.socket?.on(event, listener);
    }
    return { addedEvents, removedEvents };
  }

  emitEvent(event: string, message: unknown, type = "text") {
    return this.queueSend(event, message, type, false);
  }
  emitEventWithAck(event: string, message: unknown, type = "text") {
    return this.queueSend(event, message, type, true);
  }

  private queueSend(
    event: string,
    message: unknown,
    type: string,
    ack: boolean,
  ) {
    const operation = this.sending.then(async () => {
      if (!event || reservedEvents.has(event)) {
        throw new Error(`Invalid Socket.IO event: ${event}`);
      }
      const replace = await createVariableReplacer(this.options);
      const text = await replace(message);
      let data: unknown = text;
      switch (type.toLowerCase()) {
        case "json":
          try {
            data = JSON5.parse(text);
          } catch {
            /* Keep invalid JSON as text, as before. */
          }
          break;
        case "base64":
          if (
            /^(?:[a-z\d+/]{4})*(?:[a-z\d+/]{2}==|[a-z\d+/]{3}=)?$/i.test(text)
          ) {
            data = Buffer.from(text, "base64");
          }
          break;
        case "hexadecimal":
          if (/^(?:[a-f\d]{2})+$/i.test(text)) {
            data = Buffer.from(text, "hex");
          }
          break;
      }
      if (this.stopped || !this.socket?.connected) {
        throw new Error("Socket is not connected");
      }
      if (ack) {
        this.socket.emit(event, data, (...values: unknown[]) => {
          if (!this.stopped) {
            this.callback(
              result(
                "send_ack",
                { event, data: values.length > 1 ? values : values[0] },
                true,
                type,
              ),
            );
          }
        });
      } else {
        this.socket.emit(event, data);
      }
      this.callback(result("send", { event, data }, true, type));
    });
    this.sending = operation.catch((error) => {
      this.callback(result("error", String(error), false));
    });
    return operation;
  }

  disconnect() {
    if (this.stopped) {
      return;
    }
    this.stopped = true;
    this.pendingConnect?.(
      new SocketIoConnectionError(
        result("connect_error", "Socket.IO connection cancelled", false),
      ),
    );
    this.pendingConnect = undefined;
    const connected = this.socket?.connected;
    this.socket?.disconnect();
    if (connected) {
      this.callback(result("disconnect", "Socket disconnected successfully"));
    }
    this.resolveClosed();
  }
  awaitDisconnect() {
    return this.closed;
  }
}
