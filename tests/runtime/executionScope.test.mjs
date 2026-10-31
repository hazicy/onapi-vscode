import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";
const { ExecutionScope } = await load(
  "packages/core/src/execution/scope.ts",
  nativeDependency,
  { console },
);
const { ExecutionService } = await load(
  "packages/core/src/execution/service.ts",
  nativeDependency,
  { console },
);
const service = new ExecutionService();
function adapter() {
  return {
    protocol: "ai",
    cancelled: false,
    cancel() {
      this.cancelled = true;
    },
    execute(_, context) {
      this.publish = context.publish;
      return new Promise((resolve) => {
        this.finish = resolve;
      });
    },
  };
}
test("execution slots reject replaced events and old completion cannot delete the replacement", async () => {
  const scope = new ExecutionScope();
  const events = [];
  const first = adapter(),
    second = adapter();
  const old = scope.reserve("ai", "old", "target", first);
  const oldRun = old.execute(service, first, {}, (event) => events.push(event));
  const current = scope.reserve("ai", "new", "target", second);
  const newRun = current.execute(service, second, {}, (event) =>
    events.push(event),
  );
  assert.equal(first.cancelled, true);
  const count = events.length;
  first.publish({ protocol: "ai", type: "response.chunk", text: "obsolete" });
  first.finish();
  await oldRun;
  assert.equal(events.length, count);
  assert.equal(scope.get("ai"), current);
  second.finish();
  await newRun;
  assert.equal(scope.get("ai"), undefined);
});
test("cancelled reservations cancel adapters attached after preparation and disposal prevents execution", async () => {
  const scope = new ExecutionScope();
  const pending = scope.reserve("http", "preparing");
  pending.cancel();
  const delayed = adapter();
  pending.attach(delayed);
  assert.equal(delayed.cancelled, true);
  await scope.dispose();
  const rejected = adapter();
  const run = scope.reserve("late", "late", undefined, rejected);
  await run.execute(service, rejected, {});
  assert.equal(rejected.cancelled, true);
  assert.equal(rejected.publish, undefined);
});
test("asynchronous teardown finishes before replacement initialization and disposal cancels both", async () => {
  const scope = new ExecutionScope();
  let release;
  const old = adapter();
  old.cancel = () =>
    new Promise((resolve) => {
      release = resolve;
    });
  scope.reserve("mcp", "old", undefined, old);
  const next = adapter();
  const current = scope.reserve("mcp", "new", undefined, next);
  const running = current.execute(service, next, {});
  assert.equal(next.publish, undefined);
  release();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(typeof next.publish, "function");
  await scope.dispose();
  assert.equal(next.cancelled, true);
  next.finish();
  await running;
});
test("one failing resource cancellation does not prevent other resources from closing", async () => {
  const errors = [];
  const scope = new ExecutionScope((error) => errors.push(error));
  const failed = adapter();
  failed.cancel = () => {
    throw new Error("close failed");
  };
  const healthy = adapter();
  scope.reserve("first", "first", undefined, failed);
  scope.reserve("second", "second", undefined, healthy);
  await scope.dispose();
  assert.equal(healthy.cancelled, true);
  assert.equal(errors.length, 1);
});
