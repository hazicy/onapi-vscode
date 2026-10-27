import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "./helpers/loadTypeScript.mjs";
const { formatEnv, compareEnvironments } = await load(
  "apps/webviews/src/features/sync/utils/environment-comparison.ts",
  nativeDependency,
);
const plain = (value) => JSON.parse(JSON.stringify(value));
const environment = () => ({
  env_id: "1",
  name: "Development",
  is_private: -1,
  server_list: [
    { server_id: "1", name: "API", uri: "https://example.test", sort: 1 },
  ],
  env_var_list: {
    token: { value: "saved", current_value: "local", description: "Token" },
  },
});

test("environment comparison includes cloud values, descriptions, names and servers without mutating inputs", () => {
  const before = environment();
  const after = environment();
  after.name = "Production";
  after.server_list[0].uri = "https://production.test";
  after.env_var_list.token.value = "updated";
  after.env_var_list.token.description = "Updated token";
  const snapshot = structuredClone([before, after]);
  const differences = plain(compareEnvironments(before, after));
  assert.deepEqual(
    differences.map((row) => row.key),
    ["base_info", "server_list", "env_var_list"],
  );
  assert.equal(differences[2].previous[0]["[Cloud Value]value"], "saved");
  assert.equal(
    differences[2].next[0]["[Description]description"],
    "Updated token",
  );
  assert.deepEqual([before, after], snapshot);
});

test("runtime values and environment metadata do not produce cloud conflicts", () => {
  const before = environment();
  const after = environment();
  after.env_var_list.token.current_value = "another runtime value";
  after.env_id = "another-id";
  after.is_private = 1;
  assert.deepEqual(plain(compareEnvironments(before, after)), []);
  after.env_var_list.extra = {
    value: "added",
    description: "",
    current_value: "",
  };
  assert.deepEqual(
    plain(compareEnvironments(before, after)).map((row) => row.key),
    ["env_var_list"],
  );
});

test("missing comparison sides wait for data; empty environments retain empty display sections", () => {
  assert.deepEqual(plain(compareEnvironments(undefined, environment())), []);
  assert.deepEqual(plain(compareEnvironments(environment(), undefined)), []);
  assert.deepEqual(plain(formatEnv()), {
    base_info: { "[Environment Name]name": "" },
    server_list: [],
    env_var_list: [],
  });
});
