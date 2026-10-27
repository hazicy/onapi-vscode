import type { ExecutionEnvelope, ProtocolEvent } from "@onapi/contracts";
import type { ProtocolAdapter } from "./adapter";

export type ExecutionObserver = (event: ExecutionEnvelope) => void;

/** Pure execution boundary shared by all adapters. No host or network APIs. */
export class ExecutionService {
  private readonly observers = new Set<ExecutionObserver>();
  constructor(
    private readonly observerError: (error: unknown) => void = console.error,
  ) {}

  subscribe(observer: ExecutionObserver): () => void {
    this.observers.add(observer);
    return () => {
      this.observers.delete(observer);
    };
  }

  async execute<TRequest, TResult>(
    adapter: ProtocolAdapter<TRequest, TResult>,
    request: TRequest,
    options: {
      sessionId: string;
      targetId?: string;
      observer?: ExecutionObserver;
    },
  ): Promise<TResult> {
    let sequence = 0;
    let closed = false;
    let failed = false;
    const publish = (event: ProtocolEvent) => {
      if (closed) {
        return;
      }
      if (event.protocol !== adapter.protocol) {
        throw new Error("Adapter emitted an event for another protocol");
      }
      if (
        event.type === "execution.error" ||
        ("native" in event && event.native.error) ||
        ("result" in event && !event.result.isSuccess)
      ) {
        failed = true;
      }
      const envelope: ExecutionEnvelope = {
        protocolVersion: 1,
        sessionId: options.sessionId,
        targetId: options.targetId,
        sequence: ++sequence,
        timestamp: Date.now(),
        event,
      };
      for (const observer of new Set([
        ...this.observers,
        ...(options.observer ? [options.observer] : []),
      ])) {
        try {
          observer(envelope);
        } catch (error) {
          this.observerError(error);
        }
      }
    };
    const lifecycle = (
      type: "session.started" | "execution.completed" | "session.closed",
    ) => publish({ type, protocol: adapter.protocol, failed });
    lifecycle("session.started");
    try {
      return await adapter.execute(request, {
        sessionId: options.sessionId,
        publish,
      });
    } catch (error) {
      failed = true;
      publish({
        type: "execution.error",
        protocol: adapter.protocol,
        error: {
          message: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    } finally {
      lifecycle("execution.completed");
      lifecycle("session.closed");
      closed = true;
    }
  }
}
