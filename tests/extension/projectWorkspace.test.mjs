import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";
const plain = (value) => JSON.parse(JSON.stringify(value));

test("workspace defaults omit obsolete permissions and old persisted selections keep their identity", async () => {
  const { getUserConfig } = await load(
    "apps/extension/src/app/user-config.ts",
    nativeDependency,
  );
  let stored;
  const context = { globalState: { get: () => stored } };
  const defaults = getUserConfig(context);
  assert.deepEqual(Object.keys(defaults.currentProject).sort(), [
    "intro",
    "name",
    "project_id",
    "team_id",
  ]);
  assert.deepEqual(Object.keys(defaults.currentTeam).sort(), [
    "name",
    "project",
    "team_id",
  ]);
  stored = {
    currentProject: {
      project_id: "existing-workspace",
      team_id: "existing-group",
      name: "Existing workspace",
      intro: "Existing description",
      role: 1,
      upgrade_status: 3,
    },
    currentTeam: { team_id: "existing-group", name: "Existing", project: [] },
  };
  const selected = getUserConfig(context);
  assert.equal(selected.currentProject.project_id, "existing-workspace");
  assert.equal(selected.currentProject.name, "Existing workspace");
  assert.equal(selected.currentTeam.team_id, "existing-group");
  assert.equal(stored.currentProject.upgrade_status, 3);
});

test("explicit workspace reads and saves retain account identity and only notify the active workspace", async () => {
  const files = new Map();
  const messages = [];
  const state = {
    userConfig: {
      currentProject: { project_id: "same-project" },
      userInfo: { uid: "first-account" },
    },
  };
  const context = {
    globalState: {
      get: (key) => state[key],
      update: (key, value) => {
        state[key] = value;
      },
    },
  };
  const api = await load(
    "apps/extension/src/platform/storage/project-config.ts",
    (id) => {
      if (id === "lodash-es") return nativeDependency(id);
      if (id.endsWith("/config"))
        return {
          globalConfig: {
            openedPanels: {
              request: {
                webview: { postMessage: (message) => messages.push(message) },
              },
            },
          },
        };
      if (id === "./index" || /\/storage(?:\/index)?$/.test(id))
        return {
          hasStoredData: (_, key) => files.has(key),
          readStoredData: (_, key) => structuredClone(files.get(key)),
          updateStoredData: (_, key, change) => {
            files.set(key, change(structuredClone(files.get(key) ?? {})));
            return true;
          },
          writeStoredData: (_, key, value) => {
            files.set(key, structuredClone(value));
            return true;
          },
        };
      return {};
    },
  );
  const first = api.getProjectWorkspace(context);
  assert.equal(
    await api.saveProjectConfig(context, first, { marker: "first" }),
    true,
  );
  assert.equal(messages.length, 1);
  state.userConfig.userInfo.uid = "second-account";
  const second = api.getProjectWorkspace(context);
  assert.equal(
    await api.saveProjectConfig(context, second, { marker: "second" }),
    true,
  );
  assert.equal(messages.length, 2);
  assert.equal(api.getProjectConfig(context, first).marker, "first");
  assert.equal(api.getProjectConfig(context, second).marker, "second");
  assert.equal(
    await api.saveProjectConfig(context, first, {
      marker: "completed in first account",
    }),
    true,
  );
  assert.equal(messages.length, 2);
  assert.equal(
    files.get("projectConfig_first-account_same-project").marker,
    "completed in first account",
  );
  assert.equal(
    files.get("projectConfig_second-account_same-project").marker,
    "second",
  );
  assert.equal(
    await api.setProjectConfig(context, { marker: "current" }),
    true,
  );
  assert.equal(messages.length, 3);
  assert.equal(api.getCurrentProjectConfig(context).marker, "current");
  assert.deepEqual(plain(first), {
    projectId: "same-project",
    userId: "first-account",
  });
});

test("project config uses fresh defaults rather than migrating globalState and leaves saved names unchanged", async () => {
  const files = new Map();
  const context = {
    globalState: {
      get: (key) => {
        assert.notEqual(
          key,
          "projectConfig",
          "Old globalState config must not be read",
        );
        return undefined;
      },
    },
  };
  const api = await load(
    "apps/extension/src/platform/storage/project-config.ts",
    (id) => {
      if (id === "lodash-es") return nativeDependency(id);
      if (id.endsWith("/config")) return { globalConfig: { openedPanels: {} } };
      if (id === "./index")
        return {
          hasStoredData: (_, key) => files.has(key),
          readStoredData: (_, key) => structuredClone(files.get(key)),
          updateStoredData: (_, key, change) => {
            files.set(key, change(structuredClone(files.get(key) ?? {})));
            return true;
          },
          writeStoredData: (_, key, value) => {
            files.set(key, structuredClone(value));
            return true;
          },
        };
      return {};
    },
  );
  const workspace = { projectId: "-1", userId: -1 };
  const fresh = api.getProjectConfig(context, workspace);
  assert.ok(fresh.http.collection);
  assert.equal(files.size, 0);
  const saved = {
    ...fresh,
    envList: [{ env_id: "1", name: "Default" }],
    serverList: [{ server_id: "1", name: "default_server" }],
  };
  assert.equal(await api.saveProjectConfig(context, workspace, saved), true);
  const restored = api.getProjectConfig(context, workspace);
  assert.equal(restored.envList[0].name, "Default");
  assert.equal(restored.serverList[0].name, "default_server");
});

test("atomic config changes read the latest snapshot after acquiring the storage lock", async () => {
  const messages = [];
  let stored = {
    http: {
      activeEnvironment: "dev",
      environments: [{ id: "prod", values: [] }],
      options: {},
    },
  };
  let apply;
  const context = {
    globalState: { get: () => ({ currentProject: { project_id: "one" } }) },
  };
  const api = await load(
    "apps/extension/src/platform/storage/project-config.ts",
    (id) => {
      if (id === "lodash-es") return nativeDependency(id);
      if (id.endsWith("/config"))
        return {
          globalConfig: {
            openedPanels: {
              panel: {
                webview: { postMessage: (message) => messages.push(message) },
              },
            },
          },
        };
      if (id === "./index")
        return {
          hasStoredData: () => true,
          readStoredData: () => structuredClone(stored),
          writeStoredData: () => {
            throw new Error(
              "Atomic changes must not replace a captured snapshot",
            );
          },
          updateStoredData: (_, key, change) =>
            new Promise((resolve) => {
              apply = () => {
                stored = change(structuredClone(stored));
                resolve(true);
              };
            }),
        };
      return {};
    },
  );
  const pending = api.updateProjectConfig(
    context,
    api.getProjectWorkspace(context),
    (latest) => ({
      ...latest,
      http: { ...latest.http, activeEnvironment: "prod" },
    }),
  );
  // A request completes while this change waits for the storage lock.
  stored.http.options = {
    requester: { cookieJar: { cookies: [{ key: "session", value: "fresh" }] } },
  };
  stored.http.environments[0].values.push({
    key: "token",
    value: "fresh-token",
  });
  apply();
  assert.equal(await pending, true);
  assert.equal(stored.http.activeEnvironment, "prod");
  assert.equal(
    stored.http.options.requester.cookieJar.cookies[0].value,
    "fresh",
  );
  assert.equal(stored.http.environments[0].values[0].value, "fresh-token");
  assert.equal(messages[0].data.http.activeEnvironment, "prod");
});
