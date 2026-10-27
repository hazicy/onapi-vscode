import WebSocket, { type RawData } from "ws";
import type { IncomingMessage, OutgoingHttpHeaders } from "node:http";
import {
  createVariableReplacer,
  prepareWebSocket,
  type WebSocketRuntimeOptions,
  type WebSocketTarget,
} from "./options";

import type { WebSocketResult } from "@onapi/contracts";
export type { WebSocketResult } from "@onapi/contracts";

export class WebSocketConnectionError extends Error {
  readonly isSuccess = false;
  constructor(readonly result: WebSocketResult) {
    super(result.message);
    this.name = "WebSocketConnectionError";
  }
}

function dataType(text: string) {
  try {
    JSON.parse(text);
    return "json";
  } catch {
    /* Text need not be JSON. */
  }
  if (/^\s*(?:<!doctype html|<html[\s>])/i.test(text)) {
    return "html";
  }
  if (/^\s*<[^>]+>/.test(text)) {
    return "xml";
  }
  return "text";
}

function result(
  type: WebSocketResult["type"],
  message: string,
  isSuccess = true,
  data?: unknown,
  typeHint?: string,
): WebSocketResult {
  const content = data ?? message;
  const bytes = Buffer.isBuffer(content)
    ? content.length
    : Buffer.byteLength(
        typeof content === "string" ? content : JSON.stringify(content),
      );
  return {
    type,
    message,
    isSuccess,
    data,
    time: new Date().toTimeString().slice(0, 8),
    dataType:
      typeHint || (typeof content === "string" ? dataType(content) : "text"),
    size:
      bytes > 1024
        ? `${Math.round((bytes / 1024) * 100) / 100} kb`
        : `${bytes} byte`,
  };
}

export class WSClient {
  private socket?: WebSocket;
  private stopped = false;
  private started = false;
  private failed = false;
  private resolveClosed!: () => void;
  private readonly closed = new Promise<void>((resolve) => {
    this.resolveClosed = resolve;
  });
  private pendingMessages: Promise<void> = Promise.resolve();

  constructor(
    private readonly target: WebSocketTarget,
    private readonly options: WebSocketRuntimeOptions,
    private readonly emit: (message: WebSocketResult) => void,
  ) {}

  async connect(): Promise<WebSocketResult> {
    if (this.started) {
      throw new Error("WebSocket client has already been started");
    }
    this.started = true;
    try {
      const prepared = await prepareWebSocket(this.target, this.options);
      if (this.stopped) {
        throw new Error("WebSocket connection cancelled");
      }
      let requestHeaders: OutgoingHttpHeaders = prepared.headers;
      let response: IncomingMessage | undefined;
      prepared.clientOptions.finishRequest = (request) => {
        requestHeaders = request.getHeaders();
        request.end();
      };
      const socket = new WebSocket(
        prepared.url,
        prepared.protocols,
        prepared.clientOptions,
      );
      this.socket = socket;
      return await new Promise<WebSocketResult>((resolve, reject) => {
        let opened = false;
        socket.on("upgrade", (message) => {
          response = message;
        });
        socket.on("error", (error) => {
          this.failed = true;
          const failure = result(
            opened ? "error" : "connection",
            String(error),
            false,
          );
          if (opened) {
            this.emit(failure);
          } else {
            reject(new WebSocketConnectionError(failure));
          }
        });
        socket.on("message", (data, binary) => {
          // MIME detection is asynchronous; retain the order of server messages.
          this.pendingMessages = this.pendingMessages
            .then(() => this.receive(data, binary))
            .catch((error) => {
              this.emit(result("error", String(error), false));
            });
        });
        socket.once("close", (code, reason) => {
          if (!opened) {
            reject(
              new WebSocketConnectionError(
                result(
                  "connection",
                  "WebSocket connection closed before opening",
                  false,
                ),
              ),
            );
          }
          void this.pendingMessages.finally(() => {
            if (opened) {
              this.emit(
                result(
                  "close",
                  `Disconnected from ${prepared.url}${reason.length ? `: ${reason}` : ""}`,
                  !this.failed && (this.stopped || code !== 1006),
                ),
              );
            }
            this.resolveClosed();
          });
        });
        socket.once("open", () => {
          opened = true;
          const data = {
            url: prepared.url,
            request: { headers: requestHeaders, query: prepared.query },
            response: {
              headers: response?.headers || {},
              cookies: this.cookies(response),
              statusCode: response?.statusCode,
              statusMessage: response?.statusMessage,
            },
          };
          resolve(
            result("connection", `Connected to ${prepared.url}`, true, data),
          );
        });
      });
    } catch (error) {
      if (!this.socket) {
        this.resolveClosed();
      }
      if (error instanceof WebSocketConnectionError) {
        throw error;
      }
      throw new WebSocketConnectionError(
        result("connection", String(error), false),
      );
    }
  }

  private cookies(response?: IncomingMessage) {
    return (response?.headers["set-cookie"] || []).map((value) => {
      const [pair, ...attributes] = value.split(";");
      const index = pair.indexOf("=");
      return {
        name: pair.slice(0, index),
        key: pair.slice(0, index),
        value: pair.slice(index + 1),
        ...Object.fromEntries(
          attributes.map((attribute) => {
            const [key, ...rest] = attribute.trim().split("=");
            return [key.toLowerCase(), rest.length ? rest.join("=") : true];
          }),
        ),
      };
    });
  }

  private async receive(raw: RawData, binary: boolean) {
    const data = Buffer.isBuffer(raw)
      ? raw
      : Array.isArray(raw)
        ? Buffer.concat(raw)
        : Buffer.from(raw);
    const message = result(
      "message",
      "Success",
      true,
      data,
      binary ? "binary" : dataType(data.toString("utf8")),
    );
    if (!binary && /<svg[\s>]/i.test(data.toString("utf8"))) {
      message.contentType = "image/svg+xml";
    }
    if (binary) {
      try {
        const { fileTypeFromBuffer } = await import("file-type");
        const type = await fileTypeFromBuffer(data);
        if (type) {
          message.contentType = type.mime;
        }
      } catch {
        /* Short or unrecognized binary payloads can use the raw viewer. */
      }
    }
    this.emit(message);
  }

  async send(data: { msg?: unknown; type?: string }) {
    try {
      const replace = await createVariableReplacer(this.options);
      const message = await replace(data.msg);
      if (this.stopped || this.socket?.readyState !== WebSocket.OPEN) {
        throw new Error("The connection is not open and data cannot be sent");
      }
      const type = (data.type || "text").toLowerCase();
      const binary = type === "base64" || type === "hexadecimal";
      const payload =
        type === "base64"
          ? Buffer.from(message, "base64")
          : type === "hexadecimal"
            ? Buffer.from(message.replace(/\s+/g, ""), "hex")
            : message;
      await new Promise<void>((resolve, reject) =>
        this.socket!.send(payload, { binary }, (error) =>
          error ? reject(error) : resolve(),
        ),
      );
      this.emit(result("send", "Success", true, message, type));
    } catch (error) {
      this.emit(result("error", String(error), false));
      throw error;
    }
  }

  close() {
    this.stopped = true;
    if (!this.socket) {
      this.resolveClosed();
    } else if (this.socket.readyState === WebSocket.CONNECTING) {
      this.socket.terminate();
    } else if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
    }
  }

  wait() {
    return this.closed;
  }
}
