import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import load from "../helpers/loadTypeScript.mjs";

test("test modules fail linking when an explicit mock omits a named export", async () => {
  await assert.rejects(
    load("apps/webviews/src/features/variables/utils/variable.ts", () => ({})),
    /does not provide an export named 'includes'/,
  );
});

for (const dependency of [
  "./dependency",
  "@onapi/domain/test-loader-missing",
]) {
  test(`test imports do not retry historical aliases for ${dependency}`, async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "onapi-loader-"));
    try {
      const source = path.join(directory, "apps/webviews/src/fixture.ts");
      await mkdir(path.dirname(source), { recursive: true });
      await writeFile(
        source,
        `import {value} from "${dependency}"; export {value};`,
      );
      const imports = [];
      await assert.rejects(
        load(source, (id) => {
          imports.push(id);
          if (id === dependency) throw new Error("explicit boundary");
          // The removed alias fallback would have linked this fabricated export.
          return { value: "historical mock" };
        }),
        dependency.startsWith(".") ? /explicit boundary/ : /ENOENT/,
      );
      assert.deepEqual(imports, [dependency]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
}
