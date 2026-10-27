import { Worker } from "node:worker_threads";
import type { ExecutionContext, ProtocolAdapter } from "@onapi/core";
import type {
  ExecutionEvent,
  ProtocolEventType,
  WorkerRunCommand,
} from "@onapi/contracts";

const eventTypes: Partial<Record<ExecutionEvent["type"], ProtocolEventType>> = {
  request: "response.received",
  responseData: "response.chunk",
  assertion: "assertion.completed",
  exception: "execution.error",
};

/** Runs native Postman collections without depending on VS Code or its storage. */
export class HttpAdapter implements ProtocolAdapter<
  WorkerRunCommand,
  ExecutionEvent
> {
  readonly protocol = "http" as const;
  private worker?: Worker;
  constructor(private readonly workerUrl: URL) {}

  cancel() {
    void this.worker?.terminate();
  }

  async execute(
    request: WorkerRunCommand,
    context: ExecutionContext,
  ): Promise<ExecutionEvent> {
    let finished = false;
    const publish = (event: ExecutionEvent) =>
      context.publish({
        protocol: this.protocol,
        type: event.error
          ? "execution.error"
          : eventTypes[event.type] || "runtime.event",
        native: event,
      });
    try {
      return await new Promise<ExecutionEvent>((resolve, reject) => {
        const worker = (this.worker = new Worker(this.workerUrl));
        worker.on("message", (event: ExecutionEvent) => {
          if (finished) {
            return;
          }
          if (event.type === "done") {
            finished = true;
          }
          publish(event);
          if (event.type === "done") {
            resolve(event);
          }
        });
        worker.on("error", (error) => {
          if (finished) {
            return;
          }
          finished = true;
          publish({
            type: "done",
            error: {
              message: error instanceof Error ? error.message : String(error),
            },
          });
          reject(error);
        });
        worker.on("exit", (code) => {
          if (finished) {
            return;
          }
          finished = true;
          const event: ExecutionEvent = {
            type: "done",
            error: { message: `Run stopped (exit ${code})` },
          };
          publish(event);
          resolve(event);
        });
        worker.postMessage(request);
      });
    } catch (error) {
      // Covers worker construction/postMessage failures as well as worker errors.
      if (!finished) {
        finished = true;
        publish({
          type: "done",
          error: {
            message: error instanceof Error ? error.message : String(error),
          },
        });
      }
      throw error;
    } finally {
      const worker = this.worker;
      this.worker = undefined;
      await worker?.terminate();
    }
  }
}
