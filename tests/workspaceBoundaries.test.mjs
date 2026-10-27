import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const owners = [
  "apps/extension",
  "apps/webviews",
  "packages/domain",
  "packages/contracts",
  "packages/core",
  "packages/runtime",
  "packages/api-converter",
];

function check(source, imports, exceptions = []) {
  const output = path.join(root, "test-results");
  fs.mkdirSync(output, { recursive: true });
  const fixture = fs.mkdtempSync(path.join(output, "boundaries-"));
  try {
    for (const owner of owners) {
      fs.mkdirSync(path.join(fixture, owner, "src"), { recursive: true });
      fs.copyFileSync(
        path.join(root, owner, "package.json"),
        path.join(fixture, owner, "package.json"),
      );
    }
    fs.mkdirSync(path.join(fixture, "scripts"));
    fs.mkdirSync(path.join(fixture, "tooling"));
    fs.copyFileSync(
      path.join(root, "scripts/check-boundaries.mjs"),
      path.join(fixture, "scripts/check-boundaries.mjs"),
    );
    fs.writeFileSync(
      path.join(fixture, "tooling/webview-boundary-exceptions.json"),
      JSON.stringify(exceptions),
    );
    const filename = path.join(fixture, "apps/webviews/src", source);
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, imports);
    const result = spawnSync(
      process.execPath,
      ["scripts/check-boundaries.mjs"],
      {
        cwd: fixture,
        encoding: "utf8",
      },
    );
    if (result.error) throw result.error;
    return { status: result.status, output: result.stdout + result.stderr };
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}

test("shared boundaries reject alias, relative and dynamic feature imports", () => {
  for (const imports of [
    'import value from "@/features/settings/store";',
    'export { value } from "../features/settings/store";',
    'import("@/features/settings/store");',
  ]) {
    const result = check("shared/probe.ts", imports);
    assert.equal(result.status, 1);
    assert.match(
      result.output,
      /shared layer imports features\/settings\/store/,
    );
  }
});

test("shared boundaries allow only exact legacy edges and reject stale exceptions", () => {
  const edge = "shared/probe.ts -> features/settings/store";
  const allowed = check(
    "shared/probe.ts",
    'import value from "@/features/settings/store";',
    [edge],
  );
  assert.equal(allowed.status, 0, allowed.output);
  const different = check(
    "shared/probe.ts",
    'import value from "@/features/requests/store";',
    [edge],
  );
  assert.equal(different.status, 1);
  assert.match(
    different.output,
    /shared layer imports features\/requests\/store/,
  );
  const stale = check("shared/probe.ts", "export {};", [edge]);
  assert.equal(stale.status, 1);
  assert.match(stale.output, /Unused Webview boundary exception/);
});

test("application store barrel rejects feature re-exports but allows application state", () => {
  const forbidden = check(
    "app/store/index.ts",
    'export { default as useSettings } from "../../features/settings/store";',
  );
  assert.equal(forbidden.status, 1);
  assert.match(
    forbidden.output,
    /application store barrel re-exports a feature store/,
  );
  const allowed = check(
    "app/store/index.ts",
    'export { default as useGlobal } from "./useGlobal";',
  );
  assert.equal(allowed.status, 0, allowed.output);
});
