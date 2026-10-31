import type { ExecutionObserver, ExecutionService } from "./service";
import type { ProtocolAdapter } from "./adapter";

type Cancellable = Pick<ProtocolAdapter<unknown>, "cancel">;
type AdapterClass<T> = abstract new (...args: never[]) => T;

/** Owns resources for one editor or runner, independently of any host UI. */
export class ExecutionScope {
  private readonly entries = new Map<string, OwnedExecution>();
  private closed = false;
  constructor(
    private readonly cancellationError: (
      error: unknown,
    ) => void = console.error,
  ) {}
  get disposed() {
    return this.closed;
  }
  reserve(
    slot: string,
    sessionId: string,
    targetId?: string,
    adapter?: Cancellable,
  ): OwnedExecution {
    const previous = this.entries.get(slot);
    const execution = new OwnedExecution(this, slot, sessionId, targetId);
    if (!this.closed) {
      this.entries.set(slot, execution);
    }
    execution.previous = previous?.cancel();
    if (adapter) {
      execution.attach(adapter);
    }
    return execution;
  }
  get(slot: string) {
    return this.entries.get(slot);
  }
  find(sessionId: string) {
    return [...this.entries.values()].find(
      (entry) => entry.sessionId === sessionId,
    );
  }
  adapter<T extends Cancellable>(
    slot: string,
    type: AdapterClass<T>,
  ): T | undefined {
    const adapter = this.entries.get(slot)?.adapter;
    return adapter instanceof type ? adapter : undefined;
  }
  current(entry: OwnedExecution) {
    return !this.closed && this.entries.get(entry.slot) === entry;
  }
  release(entry: OwnedExecution) {
    if (this.entries.get(entry.slot) === entry) {
      this.entries.delete(entry.slot);
    }
  }
  report(error: unknown) {
    this.cancellationError(error);
  }
  async stop(slot: string) {
    const entry = this.entries.get(slot);
    if (entry) {
      await entry.cancel();
      await entry.done;
      entry.finish();
    }
  }
  async dispose() {
    this.closed = true;
    const entries = [...this.entries.values()];
    this.entries.clear();
    await Promise.all(entries.map((entry) => entry.cancel()));
  }
}

export class OwnedExecution {
  adapter?: Cancellable;
  cancelled = false;
  previous: void | Promise<void> = undefined;
  done: Promise<unknown> = Promise.resolve();
  constructor(
    private readonly scope: ExecutionScope,
    readonly slot: string,
    readonly sessionId: string,
    public targetId?: string,
  ) {}
  get current() {
    return this.scope.current(this);
  }
  attach(adapter: Cancellable) {
    if (this.adapter === adapter) {
      return;
    }
    if (this.adapter && this.adapter !== adapter) {
      throw new Error("Execution already owns an adapter");
    }
    this.adapter = adapter;
    if (this.cancelled || !this.current) {
      void this.cancel();
    }
  }
  cancel(): void | Promise<void> {
    this.cancelled = true;
    try {
      return this.adapter?.cancel()?.catch((error) => this.scope.report(error));
    } catch (error) {
      this.scope.report(error);
    }
  }
  finish() {
    this.scope.release(this);
  }
  execute<TRequest, TResult>(
    service: ExecutionService,
    adapter: ProtocolAdapter<TRequest, TResult>,
    request: TRequest,
    observer?: ExecutionObserver,
  ): Promise<TResult | undefined> {
    this.attach(adapter);
    const execute = () =>
      this.current
        ? service.execute(adapter, request, {
            sessionId: this.sessionId,
            targetId: this.targetId,
            observer: (event) => {
              if (this.current) {
                observer?.(event);
              }
            },
          })
        : Promise.resolve(undefined);
    const work = (
      this.previous ? this.previous.then(execute) : execute()
    ).finally(() => this.finish());
    // Keep a settled completion handle for explicit disconnect and shutdown.
    this.done = work.then(
      () => {},
      () => {},
    );
    return work;
  }
}
