import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { waitForDevServer, findDevServer } from "../../scripts/dev-readiness.mjs";

test("F5 uses a finite startup task while the supervisor retains hot reload", async () => {
  const config = JSON.parse(await readFile(".vscode/tasks.json", "utf8"));
  const launch = JSON.parse(await readFile(".vscode/launch.json", "utf8"));
  const task = config.tasks.find(
    (task) => task.label === launch.configurations[0].preLaunchTask,
  );
  assert.notEqual(task.isBackground, true);
  assert.equal(task.type, "process");
  assert.deepEqual(task.args, ["scripts/start-debug.mjs"]);
  assert.deepEqual(task.problemMatcher, []);
});

test("readiness rejects old sessions and other workspaces before accepting this server", async () => {
  let calls = 0;
  const states = [
    { root: "/other", session: "new" },
    { root: "/work", session: "old" },
    { root: "/work", session: "new" },
  ];
  const fetchMock = mock.method(globalThis, "fetch", async () => ({
    ok: true,
    json: async () => states[calls++],
  }));
  try {
    await waitForDevServer({ root: "/work", session: "new", intervalMs: 1 });
    assert.equal(calls, 3);
  } finally {
    fetchMock.mock.restore();
  }
});

test("startup reports failure instead of waiting indefinitely, and termination cancels the wait", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => {
    throw new Error("Connection refused");
  });
  try {
    await assert.rejects(
      waitForDevServer({
        root: "/work",
        session: "new",
        timeoutMs: 10,
        intervalMs: 1,
      }),
      /did not become ready/,
    );
    const controller = new AbortController();
    const waiting = waitForDevServer({
      root: "/work",
      session: "new",
      signal: controller.signal,
      intervalMs: 1,
    });
    controller.abort();
    await assert.rejects(waiting, { name: "AbortError" });
  } finally {
    fetchMock.mock.restore();
  }
});

test("an existing server is reusable only when its workspace and supervisor session match", async () => {
  let state = { root: "/other", session: "other" };
  const fetchMock = mock.method(globalThis, "fetch", async () => ({
    ok: true,
    json: async () => state,
  }));
  try {
    assert.equal(await findDevServer({ root: "/work" }), undefined);
    state = { root: "/work" };
    assert.equal(await findDevServer({ root: "/work" }), undefined);
    state = { root: "/work", session: "active" };
    assert.deepEqual(await findDevServer({ root: "/work" }), state);
  } finally {
    fetchMock.mock.restore();
  }
});

test("the real F5 startup script exits when a workspace hot reload server is already ready", async () => {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const { fileURLToPath } = await import("node:url");
  const path = await import("node:path");
  const root = fileURLToPath(new URL("../../", import.meta.url));
  const state = {
    root: path.join(root, "apps/webviews"),
    session: "running-supervisor",
  };
  const fixture =
    "data:text/javascript," +
    encodeURIComponent(
      `globalThis.fetch = async () => ({ ok: true, json: async () => (${JSON.stringify(state)}) });`,
    );
  const { stdout } = await promisify(execFile)(
    process.execPath,
    ["--import", fixture, "scripts/start-debug.mjs"],
    { cwd: root, timeout: 5000 },
  );
  assert.match(stdout, /hot reload is already ready/);
});
