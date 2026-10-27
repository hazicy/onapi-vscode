import type { ExecutionContext, ProtocolAdapter } from "@onapi/core";
import type { WebSocketResult } from "@onapi/contracts";
import { WSClient, WebSocketConnectionError } from "./client";
import type { WebSocketRuntimeOptions, WebSocketTarget } from "./options";

export interface WebSocketExecutionRequest {
  target: WebSocketTarget;
  option: WebSocketRuntimeOptions;
}

export class WebSocketAdapter implements ProtocolAdapter<WebSocketExecutionRequest> {
  readonly protocol = "websocket" as const;
  private client?: WSClient;

  cancel() {
    this.client?.close();
  }
  send(data: { msg?: unknown; type?: string }) {
    return this.client?.send(data);
  }

  async execute(request: WebSocketExecutionRequest, context: ExecutionContext) {
    const publish = (result: WebSocketResult) =>
      context.publish({
        protocol: this.protocol,
        type:
          result.type === "close"
            ? "connection.closed"
            : !result.isSuccess
              ? "execution.error"
              : result.type === "connection"
                ? "connection.opened"
                : result.type === "send"
                  ? "message.sent"
                  : "message.received",
        result,
      });
    const client = (this.client = new WSClient(
      request.target,
      request.option,
      publish,
    ));
    try {
      publish(await client.connect());
      await client.wait();
    } catch (error) {
      if (error instanceof WebSocketConnectionError) {
        publish(error.result);
      } else {
        throw error;
      }
    } finally {
      client.close();
      this.client = undefined;
    }
  }
}
