import { test } from "node:test";
import assert from "node:assert/strict";
import load from "./helpers/loadTypeScript.mjs";
import { nativeDependency } from "./helpers/loadTypeScript.mjs";
const diff = await load(
  "apps/webviews/src/features/sync/utils/environmentDiff.ts",
  (id) => nativeDependency(id),
);
const plain = (value) => JSON.parse(JSON.stringify(value));
const service = (id, extra = {}) => ({
  server_id: id,
  name: id,
  uri: `https://${id}`,
  sort: 1,
  ...extra,
});
const env = (id, extra = {}) => ({
  env_id: id,
  name: id,
  server_list: [service("one")],
  env_var_list: {
    token: { value: "saved", current_value: "runtime", description: "token" },
  },
  is_private: -1,
  ...extra,
});
async function loader(state, serviceResult, envResult) {
  return await load("apps/webviews/src/features/sync/utils/push.ts", (id) => {
    if (id === "lodash") return nativeDependency(id);
    if (id === "./environmentDiff") return diff;
    if (id === "@/app/store")
      return { useProjectConfig: { getState: () => state } };
    if (id === "@/shared/services/project")
      return {
        getServiceList: async () =>
          typeof serviceResult === "function" ? serviceResult() : serviceResult,
        getEnvListService: async () => envResult,
      };
    throw new Error(`Unexpected dependency ${id}`);
  });
}
test("empty cloud lists produce all selected new environments and local services", async () => {
  const state = {
    envList: [env("selected"), env("other")],
    serverList: [service("one")],
  };
  const snapshot = structuredClone(state);
  const result = await (
    await loader(state, [], [])
  ).getEnvConflictList(["selected"], "target");
  assert.deepEqual(plain(result.addEnvs), [
    { ...state.envList[0], project_id: "target" },
  ]);
  assert.deepEqual(plain(result.newServiceList), [
    { ...state.serverList[0], mode: "add" },
  ]);
  assert.deepEqual(state, snapshot);
  result.addEnvs[0].name = "Changed";
  assert.equal(state.envList[0].name, "selected");
});
test("service merge preserves cloud order, first matching local metadata and local-only additions", () => {
  const local = [service("one", { name: "Renamed" }), service("two")];
  const cloud = [service("three"), service("one")];
  const result = plain(diff.mergeServiceLists(local, cloud));
  assert.deepEqual(
    result.map((item) => item.server_id),
    ["three", "one", "two"],
  );
  assert.equal(result[1].name, "Renamed");
  assert.equal(result[1].mode, "update");
  assert.equal(result[2].mode, "add");
  assert.equal(local[0].mode, undefined);
  assert.equal(cloud[1].mode, undefined);
});
test("simultaneous variable and service differences create one conflict per environment", () => {
  const local = env("env");
  const cloud = env("env", {
    env_var_list: { token: { value: "cloud", description: "different" } },
    server_list: [service("one", { uri: "https://cloud" })],
  });
  const result = diff.compareEnvironments([local], [cloud], "project");
  assert.equal(result.diffEnvs.length, 1);
  result.diffEnvs[0].localEnv.env_var_list.token.value = "Edited";
  assert.equal(local.env_var_list.token.value, "saved");
});
test("default environment names, runtime values and service order do not create conflicts", () => {
  const local = env("1", { server_list: [service("one"), service("two")] });
  const cloud = env("1", {
    name: "Translated default",
    server_list: [service("two"), service("one")],
    env_var_list: {
      token: { value: "saved", current_value: "other", description: "token" },
    },
  });
  assert.equal(
    diff.compareEnvironments([local], [cloud], "project").diffEnvs.length,
    0,
  );
});
for (const [label, change] of [
  ["name", { name: "Renamed" }],
  [
    "variable key",
    { env_var_list: { other: { value: "saved", description: "token" } } },
  ],
  [
    "variable value",
    { env_var_list: { token: { value: "different", description: "token" } } },
  ],
  [
    "variable description",
    { env_var_list: { token: { value: "saved", description: "different" } } },
  ],
  ["missing service", { server_list: [] }],
  ["service identity", { server_list: [service("two")] }],
  ["service name", { server_list: [service("one", { name: "Renamed" })] }],
  [
    "service URI",
    { server_list: [service("one", { uri: "https://different" })] },
  ],
]) {
  test(`${label} differences create a conflict`, () => {
    assert.equal(
      diff.compareEnvironments([env("env")], [env("env", change)], "project")
        .diffEnvs.length,
      1,
    );
  });
}
test("missing service lists are compared as empty lists instead of discarding later environments", () => {
  const local = env("env", { server_list: undefined });
  const cloud = env("env", { server_list: undefined });
  assert.equal(
    diff.compareEnvironments([local], [cloud], "project").diffEnvs.length,
    0,
  );
  assert.equal(
    diff.compareEnvironments([local], [env("env")], "project").diffEnvs.length,
    1,
  );
});
test("configuration is snapshotted before asynchronous cloud requests", async () => {
  const state = { envList: [env("env")], serverList: [service("one")] };
  const api = await loader(state, () => {
    state.envList[0].name = "Changed during request";
    state.serverList[0].name = "Changed during request";
    return [];
  }, []);
  const result = await api.getEnvConflictList(["env"], "project");
  assert.equal(result.addEnvs[0].name, "env");
  assert.equal(result.newServiceList[0].name, "one");
});
test("network and invalid cloud responses reject conflict checking instead of returning partial success", async () => {
  const state = { envList: [env("env")], serverList: [] };
  await assert.rejects(
    (
      await loader(state, () => {
        throw new Error("Offline");
      }, [])
    ).getEnvConflictList(["env"], "project"),
    /Offline/,
  );
  await assert.rejects(
    (await loader(state, {}, [])).getEnvConflictList(["env"], "project"),
    /Unable to load/,
  );
  await assert.rejects(
    (await loader(state, [], undefined)).getEnvConflictList(["env"], "project"),
    /Unable to load/,
  );
});
test("service completion deduplicates additions and isolates mutable service data", async () => {
  const api = await loader({}, [], []);
  const local = env("env", { server_list: undefined });
  const services = [service("one"), service("one"), service("two")];
  api.completeServiceList(local, services);
  assert.deepEqual(
    Array.from(local.server_list, (item) => item.server_id),
    ["one", "two"],
  );
  local.server_list[0].name = "Edited";
  assert.equal(services[0].name, "one");
});
test("API-only pushes skip environment state and cloud configuration requests", async () => {
  const api = await loader(
    undefined,
    () => {
      throw new Error("Must not fetch");
    },
    undefined,
  );
  assert.deepEqual(plain(await api.getEnvConflictList([], "project")), {
    addEnvs: [],
    diffEnvs: [],
    newServiceList: [],
    cloudServiceList: [],
  });
});
