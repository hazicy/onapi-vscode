import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import path from "node:path";
import esbuild from "esbuild";
import assert from "node:assert/strict";

async function main() {
  const output = path.resolve(
    fileURLToPath(new URL(".", import.meta.url)),
    "../apps/webviews/dist",
  );
  assert.ok(
    (await fs.stat(path.join(output, "webviews.css"))).size > 0,
    "Webview HTML requires the extracted stylesheet.",
  );
  const entries = (await fs.readdir(output)).filter((name) =>
    /Panel(?:\.bundle)?\.js$/.test(name),
  );
  const chunks = (await fs.readdir(path.join(output, "chunks")))
    .filter((name) => name.endsWith(".js"))
    .map((name) => `chunks/${name}`);
  const expectedEntries = (
    await fs.readdir(new URL("../apps/webviews/src/app/webviews/", import.meta.url))
  )
    .filter((name) => name.endsWith("Panel.tsx"))
    .map((name) => name[0].toLowerCase() + name.slice(1).replace(/\.tsx$/, ""))
    .sort();
  assert.ok(expectedEntries.length > 0, "Expected Webview source entries.");
  assert.deepEqual(
    entries.map((name) => name.replace(/(?:\.bundle)?\.js$/, "")).sort(),
    expectedEntries,
    "Built Webview entries must match the current source panels.",
  );
  assert.ok(chunks.length > 0, "Expected shared ESM chunks.");
  // Parse emitted modules independently: injected globals and vendor-local
  // bindings can collide only after code splitting, even if bundling succeeds.
  for (const filename of [...entries, ...chunks]) {
    await esbuild.transform(
      await fs.readFile(path.join(output, filename), "utf8"),
      {
        loader: "js",
        format: "esm",
        sourcefile: filename,
        logLevel: "silent",
      },
    );
  }
  console.log(
    `Parsed ${entries.length} Webview entries and ${chunks.length} shared/lazy chunks.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
