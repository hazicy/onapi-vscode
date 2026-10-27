import { requestPanelStubs } from "./helpers/requestPanelStubs.mjs";
import { unexpectedCall as unused } from "./helpers/unexpectedCall.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import loadTypeScript from "./helpers/loadTypeScript.mjs";
import { nativeDependency } from "./helpers/loadTypeScript.mjs";
const plain = (value) => JSON.parse(JSON.stringify(value));
async function fixture(writeSucceeds = true) {
  const calls = [];
  let persisted = [
    {
      id: "original",
      parentId: "folder",
      name: "Request",
      sort: 4,
      version: 3,
    },
  ];
  const panel = (name) => ({
    webview: { postMessage: (message) => calls.push([name, plain(message)]) },
  });
  const globalConfig = {
    pushWebView: panel("push"),
    shareListWebView: panel("share"),
    openedPanels: {},
    openedFolderTestPanels: { "project:folder:test": panel("test") },
  };
  const { handleMessage } = await loadTypeScript(
    "apps/extension/src/features/sidebar/sidebar-handler.ts",
    (id) => {
      if (id.endsWith("/http-runner"))
        return {
          getExecutionCollection: () => ({
            info: { name: "Collection" },
            item: [],
          }),
        };
      if (id.endsWith("/panel-actions"))
        return { handlePanelAction: () => false };
      if (id === "lodash") return nativeDependency(id);
      if (id === "../../app/config") return { globalConfig };
      if (
        /\/(?:project-config|request-storage|report-storage|collection-order|import-curl|prepare-options|html|host-utils|user-config)$/.test(
          id,
        )
      )
        return {
          deleteProjectReport: unused,
          deleteTestingFoldersData: unused,
          getTestingFolderName: unused,
          downloadFile: unused,
          openInFileExplorer: unused,
          getAllChildIds: unused,
          setProjectApisVersion: unused,
          setProjectConfig: unused,
          getApiList: () => structuredClone(persisted),
          getApiListName: () => "project",
          updateApiList: async (_, change) => {
            const rows = change(structuredClone(persisted));
            calls.push(["write", plain(rows)]);
            if (writeSucceeds) persisted = plain(rows);
            return writeSucceeds;
          },
          getMaxSort: () => 5,
          setApiList: (rows) => {
            calls.push(["write", plain(rows)]);
            if (writeSucceeds) persisted = plain(rows);
            return writeSucceeds;
          },
          getCurrentProjectConfig: () => ({
            http: { collection: { info: { name: "Collection" }, item: [] } },
          }),
        };
      if (id === "../requests/commands")
        return {
          updateOpenData: (_, data) => calls.push(["open", plain(data)]),
        };
      if (id === "@onapi/domain/utils/data-tools")
        return { snowflakeId: () => "copy" };
      if (id === "vscode")
        return {
          window: {
            showErrorMessage: (message) => calls.push(["error", message]),
            showInformationMessage: (message) =>
              calls.push(["success", message]),
          },
        };
      return (
        requestPanelStubs[id] ?? (id === "vscode" ? {} : nativeDependency(id))
      );
    },
  );
  return { handleMessage, calls, rows: () => persisted };
}
test("saving a new folder persists before notifying every dependent view", async () => {
  const f = await fixture();
  assert.equal(
    await f.handleMessage(
      { action: "saveFolder", data: { id: "new", parentId: "folder" } },
      {},
    ),
    true,
  );
  assert.equal(f.calls[0][0], "write");
  assert.equal(f.rows()[1].sort, 5);
  assert.deepEqual(
    f.calls.map(([name]) => name),
    ["write", "push", "share", "test"],
  );
  assert.equal(f.calls.at(-1)[1].action, "postmanCollectionChanged");
  assert.equal(f.calls.at(-1)[1].data.info.name, "Collection");
});
test("renaming replaces the saved row and updates the open panel after the write", async () => {
  const f = await fixture();
  await f.handleMessage(
    {
      action: "saveFolder",
      data: { id: "original", name: "Renamed", sort: 4 },
    },
    {},
  );
  assert.equal(f.rows().length, 1);
  assert.equal(f.rows()[0].name, "Renamed");
  assert.deepEqual(
    f.calls.slice(0, 2).map(([name]) => name),
    ["write", "open"],
  );
});
test("cloning persists a new ID and reset version without modifying the original", async () => {
  const f = await fixture();
  const original = structuredClone(f.rows()[0]);
  await f.handleMessage({ action: "cloneApi", data: { id: "original" } }, {});
  assert.deepEqual(f.rows()[0], original);
  assert.deepEqual(f.rows()[1], {
    ...original,
    id: "copy",
    version: 0,
    name: "Request Copy",
    sort: 5,
  });
  assert.equal(f.calls.at(-1)[0], "success");
});
test("failed saves keep persisted data and do not broadcast or report success", async () => {
  for (const action of ["saveFolder", "cloneApi"]) {
    const f = await fixture(false);
    const original = structuredClone(f.rows());
    await f.handleMessage(
      { action, data: { id: "original", name: "Changed" } },
      {},
    );
    assert.deepEqual(f.rows(), original);
    assert.deepEqual(
      f.calls.map(([name]) => name),
      ["write", "error"],
    );
  }
});
test("setApiList propagates the actual storage result and selects the project key", async () => {
  for (const expected of [true, false]) {
    const writes = [];
    const { setApiList } = await loadTypeScript(
      "apps/extension/src/features/requests/request-storage.ts",
      async function dependencies(id) {
        if (id.endsWith("/project-config"))
          return loadTypeScript(
            "apps/extension/src/platform/storage/project-config.ts",
            dependencies,
          );
        if (id.endsWith("/panel-actions"))
          return { handlePanelAction: () => false };
        if (id === "lodash") return nativeDependency(id);
        if (id.endsWith("/config"))
          return { globalConfig: { openedPanels: {} } };
        if (id === "./index" || /\/storage(?:\/index)?$/.test(id))
          return {
            updateDataInGlobalStorage: unused,
            hasStoredData: () => true,
            getDataFromGlobalStorage: (_, key, fallback) => fallback || {},
            setDataToGlobalStorage: (...args) => {
              writes.push(args);
              return expected;
            },
          };
        return (
          requestPanelStubs[id] ?? (id === "vscode" ? {} : nativeDependency(id))
        );
      },
    );
    const context = {
      globalState: {
        get: () => ({ currentProject: { project_id: "workspace" } }),
      },
    };
    const rows = [
      {
        id: "saved",
        parentId: "0",
        kind: "api",
        name: "Saved",
        request: { method: "GET", url: "https://example.com" },
      },
    ];
    assert.equal(await setApiList(rows, context), expected);
    assert.equal(writes[0][0], context);
    assert.equal(writes[0][1], "apiList:workspace");
    assert.deepEqual(plain(writes[0][2]), rows);
    assert.equal(writes.length, 1);
  }
});
test("opening a request deleted since the UI rendered safely skips both message handlers", async () => {
  for (const [filename, handler] of [
    ["sidebar/sidebar-handler.ts", "handleMessage"],
    ["requests/request-panel-handler.ts", "handleRequestPanelCommand"],
  ]) {
    const commands = [];
    const handlers = await loadTypeScript(
      `apps/extension/src/features/${filename}`,
      (id) => {
        if (
          /\/(?:project-config|request-storage|report-storage|collection-order|import-curl|prepare-options|html|host-utils|user-config)$/.test(
            id,
          )
        )
          return {
            deleteProjectReport: unused,
            deleteTestingFoldersData: unused,
            getTestingFolderName: unused,
            downloadFile: unused,
            openInFileExplorer: unused,
            getAllChildIds: unused,
            setProjectApisVersion: unused,
            getApiList: () => [],
            getApiListName: unused,
            updateApiList: unused,
            setApiList: unused,
            showTabName: unused,
            getCurrentProjectConfig: unused,
            setProjectConfig: unused,
            getMaxSort: unused,
          };
        if (id.endsWith("/panel-actions"))
          return { handlePanelAction: () => false };
        if (id === "../../app/config")
          return { globalConfig: {}, DEFAULT_TARGET_NAME: {} };
        if (id === "vscode")
          return {
            commands: { executeCommand: (...args) => commands.push(args) },
          };
        return (
          requestPanelStubs[id] ?? (id === "vscode" ? {} : nativeDependency(id))
        );
      },
    );
    await handlers[handler](
      { action: "openTagPanelById", data: "deleted" },
      {},
      {},
      {},
    );
    assert.deepEqual(commands, []);
  }
});
test("request storage returns unified records without reading a second collection", async () => {
  const reads = [];
  const rows = [
    { id: "folder", parentId: "0", kind: "folder", name: "Folder" },
    {
      id: "request",
      parentId: "folder",
      kind: "api",
      name: "Request",
      request: { method: "POST", url: "https://example.com" },
      event: [
        { listen: "test", script: { exec: ["pm.test('native',()=>{});"] } },
      ],
    },
  ];
  const { getApiList } = await loadTypeScript(
    "apps/extension/src/features/requests/request-storage.ts",
    (id) => {
      if (id === "lodash") return nativeDependency(id);
      if (/\/storage(?:\/index)?$/.test(id))
        return {
          setDataToGlobalStorage: unused,
          updateDataInGlobalStorage: unused,
          getDataFromGlobalStorage: (_, key) => {
            reads.push(key);
            return structuredClone(rows);
          },
        };
      return (
        requestPanelStubs[id] ?? (id === "vscode" ? {} : nativeDependency(id))
      );
    },
  );
  const actual = getApiList({
    globalState: {
      get: () => ({ currentProject: { project_id: "workspace" } }),
    },
  });
  assert.deepEqual(plain(actual), rows);
  assert.deepEqual(reads, ["apiList:workspace"]);
});
