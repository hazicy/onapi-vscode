import { test } from "node:test";
import assert from "node:assert/strict";
import load from "./helpers/loadTypeScript.mjs";
import { nativeDependency } from "./helpers/loadTypeScript.mjs";
const { resolveEnvironmentConflicts } = await load(
  "apps/webviews/src/features/sync/utils/environmentDiff.ts",
  (id) => nativeDependency(id),
);
const plain = (value) => JSON.parse(JSON.stringify(value));
const server = (id, name = id) => ({
  server_id: id,
  name,
  uri: `https://${name}`,
  sort: 1,
});
const environment = (id, side) => ({
  env_id: id,
  name: `${side} name`,
  is_private: side === "local" ? -1 : 1,
  server_list: [server("shared", side), server(side)],
  env_var_list: {
    shared: { value: side, current_value: side, description: side },
    [side]: { value: side },
  },
});
const conflicts = () =>
  ["a", "b"].map((id) => ({
    localEnv: environment(id, "local"),
    cloudEnv: environment(id, "cloud"),
  }));
for (const mode of ["local", "cloud", "mergeCloud", "mergeLocal"]) {
  test(`${mode} resolves only selected rows and leaves unselected environments out of uploads`, () => {
    const input = conflicts();
    const snapshot = structuredClone(input);
    const result = resolveEnvironmentConflicts(
      input,
      ["a"],
      mode,
      [server("extra")],
      [],
    );
    assert.deepEqual(
      Array.from(result.conflictItems, (item) => item.localEnv.env_id),
      ["b"],
    );
    assert.deepEqual(
      Array.from(result.uploadItems, (item) => item.env_id),
      mode === "cloud" ? [] : ["a"],
    );
    assert.deepEqual(input, snapshot);
    if (mode !== "cloud") {
      result.uploadItems[0].server_list[0].name = "Changed";
      result.uploadItems[0].env_var_list.shared.value = "Changed";
      assert.deepEqual(input, snapshot);
    }
  });
}
test("merge modes preserve service order and apply the chosen field precedence", () => {
  for (const mode of ["mergeCloud", "mergeLocal"]) {
    const result = resolveEnvironmentConflicts(conflicts(), ["a"], mode, [], [])
      .uploadItems[0];
    const winner = mode === "mergeCloud" ? "cloud" : "local";
    assert.equal(result.name, `${winner} name`);
    assert.equal(result.is_private, 1);
    assert.equal(result.env_var_list.shared.value, winner);
    assert.ok(result.env_var_list.local);
    assert.ok(result.env_var_list.cloud);
    assert.deepEqual(
      Array.from(result.server_list, (item) => item.server_id),
      ["shared", "local", "cloud"],
    );
    assert.equal(result.server_list[0].name, winner);
  }
});
test("local mode preserves local fields and fills missing configured services", () => {
  const result = resolveEnvironmentConflicts(
    conflicts(),
    ["a"],
    "local",
    [server("shared", "ignored"), server("extra")],
    [],
  ).uploadItems[0];
  assert.equal(result.name, "local name");
  assert.equal(result.is_private, -1);
  assert.equal(result.server_list[0].name, "local");
  assert.deepEqual(
    Array.from(result.server_list, (item) => item.server_id),
    ["shared", "local", "extra"],
  );
  assert.equal(result.env_var_list.cloud, undefined);
});
test("repeated resolution replaces queued environments by ID and cloud choice removes queued rows", () => {
  const previous = [
    environment("a", "local"),
    environment("unrelated", "local"),
  ];
  const updated = resolveEnvironmentConflicts(
    conflicts(),
    ["a", "a"],
    "mergeCloud",
    [],
    previous,
  );
  assert.deepEqual(
    Array.from(updated.uploadItems, (item) => item.env_id),
    ["a", "unrelated"],
  );
  assert.equal(updated.uploadItems[0].name, "cloud name");
  const removed = resolveEnvironmentConflicts(
    conflicts(),
    ["a"],
    "cloud",
    [],
    updated.uploadItems,
  );
  assert.deepEqual(
    Array.from(removed.uploadItems, (item) => item.env_id),
    ["unrelated"],
  );
  assert.equal(previous[0].name, "local name");
});
test("empty or stale selection leaves conflicts intact and missing service lists can merge", () => {
  for (const selected of [[], ["stale"]]) {
    const result = resolveEnvironmentConflicts(
      conflicts(),
      selected,
      "local",
      [],
      [],
    );
    assert.equal(result.conflictItems.length, 2);
    assert.equal(result.uploadItems.length, 0);
  }
  const conflict = {
    localEnv: { ...environment("a", "local"), server_list: undefined },
    cloudEnv: { ...environment("a", "cloud"), server_list: undefined },
  };
  const result = resolveEnvironmentConflicts(
    [conflict],
    ["a"],
    "mergeLocal",
    [],
    [],
  );
  assert.deepEqual(plain(result.uploadItems[0].server_list), []);
});
