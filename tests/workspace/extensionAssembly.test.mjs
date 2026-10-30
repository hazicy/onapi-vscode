import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  rm,
  readdir,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { assembleExtension } from "../../scripts/assemble-extension.mjs";

test("concurrent assembly keeps published Workers available and never exposes partial files", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "onapi-assembly-"));
  const oldWorker = "old worker";
  const newWorker = "new worker";
  const oldRuntime = "old runtime";
  const newRuntime = "new runtime".repeat(100000);
  const files = {
    "apps/extension/.build/extension.js": "export function activate() {}",
    "apps/webviews/dist/tagPanel.js": "webview",
    "packages/runtime/dist/worker.js": newWorker,
    "packages/runtime/dist/postman.cjs": newRuntime,
    "apps/webviews/public/images/icon.svg": "icon",
    "apps/webviews/public/scalar.standalone.js": "scalar",
    "apps/webviews/public/scalar.LICENSE.txt": "MIT",
    "apps/webviews/public/404.html": "404",
    "README.md": "readme",
    "CHANGELOG.md": "changes",
    "LICENSE.txt": "license",
    "apps/extension/package.json": JSON.stringify({
      repository: "https://example.com/repo.git",
    }),
    "apps/extension/dist/runtime/worker.js": oldWorker,
    "apps/extension/dist/runtime/postman.cjs": oldRuntime,
  };
  try {
    for (const [file, contents] of Object.entries(files)) {
      const target = path.join(root, file);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, contents);
    }
    let finished = false;
    const assembly = Promise.all([
      assembleExtension({ workspaceRoot: root }),
      assembleExtension({ workspaceRoot: root }),
    ]).finally(() => {
      finished = true;
    });
    let reads = 0;
    while (!finished) {
      const worker = await readFile(
        path.join(root, "apps/extension/dist/runtime/worker.js"),
        "utf8",
      );
      const runtime = await readFile(
        path.join(root, "apps/extension/dist/runtime/postman.cjs"),
        "utf8",
      );
      assert.ok([oldWorker, newWorker].includes(worker));
      assert.ok([oldRuntime, newRuntime].includes(runtime));
      reads++;
    }
    await assembly;
    assert.ok(reads > 0);
    assert.equal(
      await readFile(
        path.join(root, "apps/extension/dist/runtime/worker.js"),
        "utf8",
      ),
      newWorker,
    );
    assert.equal(
      await readFile(
        path.join(root, "apps/extension/dist/runtime/postman.cjs"),
        "utf8",
      ),
      newRuntime,
    );
    const obsolete = path.join(
      root,
      "apps/extension/dist/runtime/obsolete.cjs.map",
    );
    await writeFile(obsolete, "old source map");
    await assembleExtension({ workspaceRoot: root, clean: true });
    await assert.rejects(readFile(obsolete), { code: "ENOENT" });
    assert.deepEqual(await readdir(path.join(root, "artifacts")), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
