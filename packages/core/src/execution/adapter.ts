import type { ProtocolEvent, ExecutionProtocol } from "@onapi/contracts";

export interface ExecutionContext {
  readonly sessionId: string;
  publish(event: ProtocolEvent): void;
}

/** Adapters own protocol behavior; the host owns UI and persistence. */
export interface ProtocolAdapter<TRequest, TResult = void> {
  readonly protocol: ExecutionProtocol;
  execute(request: TRequest, context: ExecutionContext): Promise<TResult>;
  cancel(): void | Promise<void>;
}
