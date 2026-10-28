import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Worker } from "node:worker_threads";
import { buildFormatter } from "../../apps/extension/build/formatter.mjs";

test("packaged Oxfmt worker preserves data and correlates concurrent requests", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "onapi-format-test-"));
  let worker;
  try {
    await buildFormatter(directory);
    worker = new Worker(path.join(directory, "formatter/worker.mjs"));
    const cases = [
      ["json", '{/*keep*/"id":9007199254740993123,"a":1}', "json"],
      ["html", "<html><body><div>Hello</div></body></html>", "html"],
      ["invalid", '{"a":', "json"],
      ["xml", "<root><item/></root>", "xml"],
      ["json5", "{name:'sample',items:[1,2,],}", "json5"],
    ];
    const results = await new Promise((resolve, reject) => {
      const received = new Map();
      const timeout = setTimeout(
        () => reject(new Error("Formatter timed out")),
        15000,
      );
      worker.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      worker.on("message", ({ requestId, value }) => {
        received.set(requestId, value);
        if (received.size === cases.length) {
          clearTimeout(timeout);
          resolve(received);
        }
      });
      for (const [requestId, source, language] of cases)
        worker.postMessage({ requestId, source, language });
    });
    assert.match(results.get("json"), /9007199254740993123/);
    assert.match(results.get("json"), /\/\*keep\*\//);
    assert.match(results.get("html"), /\n/);
    assert.match(results.get("json5"), /sample/);
    for (const [id, source] of cases.filter(([id]) =>
      ["invalid", "xml"].includes(id),
    ))
      assert.equal(results.get(id), source);
  } finally {
    await worker?.terminate();
    await rm(directory, { recursive: true, force: true });
  }
});
