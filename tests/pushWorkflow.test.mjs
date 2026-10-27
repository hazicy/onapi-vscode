import { test } from "node:test";
import assert from "node:assert/strict";
import load from "./helpers/loadTypeScript.mjs";
import { nativeDependency } from "./helpers/loadTypeScript.mjs";
const versions = await load(
  "packages/domain/src/sync/utils/api-versions.ts",
  (id) => nativeDependency(id),
);
const environmentDiff = await load(
  "apps/webviews/src/features/sync/utils/environmentDiff.ts",
  (id) => nativeDependency(id),
);
const plain = (value) => JSON.parse(JSON.stringify(value));
async function fixture({
  apiSelected = true,
  failUpload = false,
  invalidVersions = false,
  uploaded = [{ id: "request", version: 2 }],
  tab = "apis",
  envData = {},
  apiData = {},
} = {}) {
  const calls = [];
  let hook = 0;
  const local = [
    {
      id: "request",
      kind: "api",
      parentId: "folder",
      version: 1,
      name: "Local",
    },
  ];
  const pushEnv = {
    checkedKeys: ["env"],
    addEnvs: [],
    newServiceList: [],
    uploadItems: [],
    ...envData,
  };
  const pushApi = {
    checkedKeys: apiSelected ? ["request"] : [],
    conflictItems: [],
    ...apiData,
  };
  const { default: Push } = await load(
    "apps/webviews/src/features/sync/components/Push/Push.tsx",
    (id) => {
      if (id.endsWith(".css")) return {};
      if (id === "react/jsx-runtime")
        return {
          jsx: (type, props) => ({ type, props }),
          jsxs: (type, props) => ({ type, props }),
        };
      if (id === "react")
        return {
          useState: (initial) => {
            const index = hook++;
            const value =
              index === 4
                ? pushEnv
                : index === 5
                  ? pushApi
                  : index === 3
                    ? tab
                    : initial;
            return [value, (next) => calls.push(["state", index, next])];
          },
        };
      if (id === "react-i18next")
        return { useTranslation: () => ({ t: (key) => key }) };
      if (id === "zustand/react/shallow")
        return { useShallow: (selector) => selector };
      if (id === "@/shared/ui/base")
        return {
          Spin: "Spin",
          message: { error: (message) => calls.push(["error", message]) },
        };
      if (id === "@/shared/ui/Modal")
        return { Modal: { useModal: () => [{}, null] } };
      if (id === "@/features/requests/store/useApis")
        return {
          default: (selector) =>
            selector({
              apiOriginDetailsList: local,
              localProjectApisVersion: {},
            }),
        };
      if (id === "@/features/project/store/useProjectConfig")
        return {
          default: (selector) => selector({ envList: [], serverList: [] }),
        };
      if (id === "@/features/auth/store/useUserConfig")
        return {
          default: (selector) =>
            selector({ currentProject: { project_id: "target" } }),
        };
      if (id === "@/features/sync/utils/push")
        return {
          getEnvConflictList: async () => ({
            addEnvs: [],
            diffEnvs: [],
            newServiceList: [],
            cloudServiceList: [],
          }),
        };
      if (
        [
          "@/features/sync/utils/apiVersions",
          "@onapi/domain/sync/utils/api-versions",
        ].includes(id)
      )
        return versions;
      if (id === "@/features/sync/utils/environmentDiff")
        return environmentDiff;
      if (id === "@/shared/services/apis")
        return {
          getApisListService: async () => (invalidVersions ? {} : { list: [] }),
          batchSaveApiService: async () => {
            calls.push(["upload"]);
            if (failUpload) throw new Error("Upload failed");
            return { list: uploaded };
          },
        };
      if (id === "@/shared/services/project") return {};
      if (id === "./Left/Left" || id === "./Right/Right") return id;
      return nativeDependency(id);
    },
    {
      window: {
        vscode: {
          postMessage: (message) => calls.push(["post", plain(message)]),
        },
      },
    },
  );
  const tree = Push();
  const handlers = tree.props.children[0].props.children[0].props;
  return { handlers, calls, local };
}
for (const action of ["handlePush", "conflictPush"]) {
  test(`${action} clears loading on environment-only early success`, async () => {
    const f = await fixture({ apiSelected: false });
    await f.handlers[action]();
    assert.deepEqual(
      f.calls
        .filter(([name, index]) => name === "state" && index === 1)
        .map((call) => call[2]),
      [true, false],
    );
    assert.equal(
      f.calls.find(([name]) => name === "upload"),
      undefined,
    );
    assert.ok(
      f.calls.find(
        ([name, data]) => name === "post" && data.action === "completePush",
      ),
    );
  });
  test(`${action} reports upload failure and always clears loading`, async () => {
    const f = await fixture({ failUpload: true });
    await f.handlers[action]();
    assert.match(
      f.calls.find(([name]) => name === "error")[1],
      /Upload failed/,
    );
    assert.deepEqual(f.calls.at(-1), ["state", 1, false]);
    assert.equal(
      f.calls.find(
        ([name, data]) => name === "post" && data.action === "completePush",
      ),
      undefined,
    );
  });
  test(`${action} sends only submitted IDs and versions without posting a local-list snapshot`, async () => {
    const f = await fixture({
      uploaded: [
        { id: "unknown", version: 9 },
        { id: "request", version: 2 },
      ],
    });
    await f.handlers[action]();
    const completed = f.calls.find(
      ([name, data]) => name === "post" && data.action === "completePush",
    )[1].data;
    assert.deepEqual(completed, {
      project_id: "target",
      versions: [{ id: "request", version: 2 }],
    });
    assert.equal(
      f.calls.find(
        ([name, data]) => name === "post" && data.action === "setApiList",
      ),
      undefined,
    );
    assert.equal(f.local[0].version, 1);
    assert.deepEqual(f.calls.at(-1), ["state", 1, false]);
  });
}
test("invalid cloud version lists abort before upload instead of assuming no conflicts", async () => {
  const f = await fixture({ invalidVersions: true });
  await f.handlers.handlePush();
  assert.match(
    f.calls.find(([name]) => name === "error")[1],
    /Unable to load API versions/,
  );
  assert.equal(
    f.calls.find(([name]) => name === "upload"),
    undefined,
  );
});
for (const mode of ["local", "cloud", "mergeLocal", "mergeCloud"]) {
  test(`environment ${mode} UI resolution queues only the selected conflict`, async () => {
    const conflicts = ["a", "b"].map((env_id) => ({
      localEnv: { env_id, name: "Local", server_list: [], env_var_list: {} },
      cloudEnv: { env_id, name: "Cloud", server_list: [], env_var_list: {} },
    }));
    const f = await fixture({
      tab: "env",
      envData: {
        conflictType: mode,
        conflictCheckedKeys: ["a"],
        conflictItems: conflicts,
      },
    });
    await f.handlers.handleFix();
    const next = f.calls.find(
      ([name, index]) => name === "state" && index === 4,
    )[2];
    assert.deepEqual(
      Array.from(next.conflictItems, (item) => item.localEnv.env_id),
      ["b"],
    );
    assert.deepEqual(
      Array.from(next.uploadItems, (item) => item.env_id),
      mode === "cloud" ? [] : ["a"],
    );
    assert.deepEqual(Array.from(next.conflictCheckedKeys), []);
    assert.equal(
      f.calls.find(([name]) => name === "upload"),
      undefined,
    );
  });
}
for (const mode of ["local", "cloud"]) {
  test(`API ${mode} resolution keeps unchecked conflicts and updates only selected upload IDs`, async () => {
    const f = await fixture({
      apiData: {
        checkedKeys: ["a", "b"],
        conflictType: mode,
        conflictCheckedKeys: ["a", "a", "stale"],
        conflictItems: [{ id: "a" }, { id: "b" }],
      },
    });
    await f.handlers.handleFix();
    const next = f.calls.find(
      ([name, index]) => name === "state" && index === 5,
    )[2];
    assert.deepEqual(
      Array.from(next.conflictItems, (item) => item.id),
      ["b"],
    );
    assert.deepEqual(
      Array.from(next.checkedKeys),
      mode === "cloud" ? ["b"] : ["a", "b"],
    );
    assert.equal(
      f.calls.find(([name]) => name === "upload"),
      undefined,
    );
  });
}
test("API completion uses remaining conflicts instead of raw selected-key count", async () => {
  const f = await fixture({
    apiData: {
      conflictType: "local",
      conflictCheckedKeys: ["request", "request", "stale"],
      conflictItems: [{ id: "request" }],
    },
  });
  await f.handlers.handleFix();
  assert.ok(f.calls.find(([name]) => name === "upload"));
  assert.ok(
    f.calls.find(
      ([name, data]) => name === "post" && data.action === "completePush",
    ),
  );
});
test("empty conflict selections leave state and upload queues untouched", async () => {
  for (const tab of ["apis", "env"]) {
    const f = await fixture({
      tab,
      apiData: { conflictType: "local", conflictCheckedKeys: [] },
      envData: { conflictType: "local", conflictCheckedKeys: [] },
    });
    await f.handlers.handleFix();
    assert.deepEqual(
      f.calls.map(([name]) => name),
      ["error"],
    );
  }
});
