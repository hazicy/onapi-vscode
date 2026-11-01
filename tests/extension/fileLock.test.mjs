import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { fork } from "node:child_process";
import { once } from "node:events";
import { build } from "esbuild";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";

const { withStorageFileLock } = await load(
  "apps/extension/src/platform/storage/file-lock.ts",
  nativeDependency,
);

test("storage lock excludes a separate process and releases after work throws", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "storage-lock-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const bundle = path.join(directory, "lock.cjs");
  await build({
    entryPoints: ["apps/extension/src/platform/storage/file-lock.ts"],
    outfile: bundle,
    bundle: true,
    platform: "node",
    format: "cjs",
  });
  const script = path.join(directory, "child.cjs");
  await fs.writeFile(
    script,
    `
    const { withStorageFileLock } = require('./lock.cjs');
    withStorageFileLock(process.argv[2], async () => {
      process.send('locked');
      await new Promise(resolve => process.once('message', resolve));
    }).then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
  `,
  );
  const target = path.join(directory, "storage");
  const child = fork(script, [target], {
    stdio: ["ignore", "ignore", "pipe", "ipc"],
  });
  t.after(() => {
    if (child.exitCode === null) child.kill();
  });
  const exited = once(child, "exit");
  assert.equal((await once(child, "message"))[0], "locked");
  let entered = false;
  const pending = withStorageFileLock(target, async () => {
    entered = true;
    throw new Error("failed work");
  });
  const rejected = assert.rejects(pending, /failed work/);
  try {
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.equal(entered, false);
  } finally {
    child.send("release");
  }
  assert.equal((await exited)[0], 0);
  await rejected;
  assert.equal(entered, true);
  assert.equal(
    await withStorageFileLock(target, async () => "reacquired"),
    "reacquired",
  );
});

test("a compromised lock stops mutations and does not release a successor's lock", async () => {
  let options;
  let releases = 0;
  const { withStorageFileLock: withLock } = await load(
    "apps/extension/src/platform/storage/file-lock.ts",
    (id) =>
      id === "proper-lockfile"
        ? {
            lock: async (_, config) => {
              options = config;
              return async () => {
                releases++;
              };
            },
          }
        : id === "node:fs/promises"
          ? { mkdir: async () => {} }
          : nativeDependency(id),
  );
  const lost = new Error("lost ownership");
  await assert.rejects(
    withLock("/fixture/storage", async (assertOwned) => {
      options.onCompromised(lost);
      assert.throws(assertOwned, /lost ownership/);
    }),
    /lost ownership/,
  );
  assert.equal(releases, 0);
});
