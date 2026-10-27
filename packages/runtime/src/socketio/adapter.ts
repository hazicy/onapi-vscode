import type { ExecutionContext, ProtocolAdapter } from "@onapi/core";
import type { SocketIoResult } from "@onapi/contracts";
import type { SocketClient, SocketEvent, SocketIoTarget } from "./client";
import type { WebSocketRuntimeOptions } from "../websocket/options";

export interface SocketIoExecutionRequest {
  target: SocketIoTarget;
  option: WebSocketRuntimeOptions;
}
export class SocketIoAdapter implements ProtocolAdapter<SocketIoExecutionRequest> {
  readonly protocol = "socketio" as const;
  private client?: SocketClient;
  private context?: ExecutionContext;
  private cancelled = false;

  cancel() {
    this.cancelled = true;
    this.client?.disconnect();
  }
  send(data: {
    event: string;
    msg: unknown;
    type?: string;
    is_ack?: boolean | number | string;
  }) {
    if (!data.event) {
      return;
    }
    return data.is_ack === true || Number(data.is_ack) === 1
      ? this.client?.emitEventWithAck(data.event, data.msg, data.type)
      : this.client?.emitEvent(data.event, data.msg, data.type);
  }
  updateEvent(parameters: SocketEvent[]) {
    if (!this.client) {
      return;
    }
    this.context?.publish({
      protocol: this.protocol,
      type: "subscriptions.updated",
      subscriptions: this.client.updateEvent(parameters),
    });
  }

  async execute(request: SocketIoExecutionRequest, context: ExecutionContext) {
    const { SocketClient, SocketIoConnectionError } = await import("./client");
    if (this.cancelled) {
      return;
    }
    this.context = context;
    const publish = (result: SocketIoResult) =>
      context.publish({
        protocol: this.protocol,
        type:
          result.type === "disconnect"
            ? "connection.closed"
            : !result.isSuccess
              ? "execution.error"
              : result.type === "connect"
                ? "connection.opened"
                : result.type === "send_ack"
                  ? "ack.received"
                  : result.type === "send"
                    ? "message.sent"
                    : "message.received",
        result,
      });
    const client = (this.client = new SocketClient(
      request.target,
      request.option,
      publish,
    ));
    try {
      publish(await client.connect());
      context.publish({
        protocol: this.protocol,
        type: "subscriptions.updated",
        subscriptions: {
          addedEvents: client.subscribedEvents,
          removedEvents: [],
        },
      });
      await client.awaitDisconnect();
    } catch (error) {
      if (error instanceof SocketIoConnectionError) {
        publish(error.result);
      } else {
        throw error;
      }
    } finally {
      client.disconnect();
      this.client = undefined;
      this.context = undefined;
    }
  }
}
