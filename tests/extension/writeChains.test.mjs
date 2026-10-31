import { requestPanelStubs } from "../helpers/requestPanelStubs.mjs";
import { unexpectedCall as unused } from "../helpers/unexpectedCall.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import load from "../helpers/loadTypeScript.mjs";
import { nativeDependency } from "../helpers/loadTypeScript.mjs";
const plain = (value) => JSON.parse(JSON.stringify(value));
async function fixture(
  file,
  {
    succeeds = true,
    environmentSucceeds = true,
    cleanupSucceeds = true,
    confirmation,
    writeGate,
    onWrite,
    closeAllowed = true,
  } = {},
) {
  class TabInputCustom {
    viewType = "onapi.request";
  }
  const calls = [];
  const context = {
    globalState: {
      get: () => ({}),
      update: async () => calls.push(["switch-workspace"]),
    },
  };
  let rows = [
    { id: "folder", parentId: "0", kind: "folder", sort: 1 },
    {
      id: "request",
      parentId: "folder",
      kind: "api",
      name: "Original",
      sort: 1,
    },
    { id: "other", parentId: "0", kind: "api", sort: 2 },
  ];
  let project = "one";
  const panel = (name) => ({
    title: "Unsaved ⚈",
    webview: { postMessage: (message) => calls.push([name, plain(message)]) },
    dispose: () => calls.push(["dispose", name]),
  });
  const editor = panel("editor");
  const config = {
    shareListWebView: panel("share"),
    importDataWebView: panel("import"),
    openedPanels: { request: editor },
    openedFolderTestPanels: {},
  };
  const tree = await load(
    "apps/extension/src/features/collections/collection-tree.ts",
    () => ({}),
  );
  const dependencies = (id) => {
    if (id.endsWith("/request-editor")) return { discardRequestDocuments() {} };

    if (id.endsWith("/panel-actions"))
      return { handlePanelAction: () => false };
    if (id === "lodash") return nativeDependency(id);
    if (id === "./request-status") return { setRequestDraft: () => {} };
    if (id === "../sidebar/protocol-icon")
      return { getProtocolIcon: () => undefined };
    if (id === "../../app/config")
      return {
        globalConfig: config,
        DEFAULT_TARGET_NAME: { api: "HTTP Request" },
      };
    if (
      /\/(?:project-config|request-storage|report-storage|collection-order|import-curl|prepare-options|html|host-utils|user-config)$/.test(
        id,
      )
    )
      return {
        curlImport: unused,
        downloadFile: unused,
        openInFileExplorer: unused,
        deleteProjectReport: unused,
        getCurrentProjectId: unused,
        getApiList: () => structuredClone(rows),
        getApiListName: () => project,
        updateApiListForWorkspace: async (_, workspace, change) => {
          const list = change(structuredClone(rows));
          calls.push(["write", plain(list)]);
          onWrite?.();
          if (writeGate) await writeGate;
          if (succeeds) rows = plain(list);
          return succeeds;
        },
        updateApiList: async (_, change) => {
          const list = change(structuredClone(rows));
          calls.push(["write", plain(list)]);
          onWrite?.();
          if (writeGate) await writeGate;
          if (succeeds) rows = plain(list);
          return succeeds;
        },
        getMaxSort: (list, parent) =>
          Math.max(
            0,
            ...list
              .filter((item) => item.parentId === parent)
              .map((item) => item.sort),
          ) + 1,
        setApiList: (list) => {
          calls.push(["write", plain(list)]);
          if (succeeds) rows = plain(list);
          return succeeds;
        },
        getAllChildIds: tree.getCollectionChildIds,
        getTestingFolderName: (id) => id,
        deleteTestingFoldersData: (ids) => {
          calls.push(["deleteTest", [...ids]]);
          return cleanupSucceeds;
        },
        showTabName: (name) => name,
        getCurrentProjectConfig: () => ({ envList: [], serverList: [] }),
        setProjectConfig: () => {
          calls.push(["writeEnv"]);
          return environmentSucceeds;
        },
      };
    if (id === "../requests/commands")
      return {
        updateOpenData: (_, data) => calls.push(["open", plain(data)]),
      };
    if (id === "../sharing/share-data")
      return {
        createShare: unused,
        deleteShare: unused,
        getOpenApi: unused,
        setProjectShareData: unused,
        getProjectShareData: () => {
          calls.push(["shareRead"]);
          return (
            requestPanelStubs[id] ??
            (id === "vscode" ? {} : nativeDependency(id))
          );
        },
      };
    if (id === "@/features/requests/utils/apis")
      return { createBatchApi: (items) => items };
    if (id === "vscode")
      return {
        TabInputCustom,
        window: {
          tabGroups: {
            all: [{ tabs: [{ input: new TabInputCustom() }] }],
            close: async () => {
              calls.push(["close-tabs"]);
              return closeAllowed;
            },
          },
          showInputBox: async () => "Renamed",
          showErrorMessage: (message) => calls.push(["error", message]),
          showInformationMessage: async (message, options) => {
            if (options?.modal) return confirmation ? confirmation() : "Yes";
            calls.push(["success", message]);
          },
        },
      };
    return (
      requestPanelStubs[id] ?? (id === "vscode" ? {} : nativeDependency(id))
    );
  };
  const exports = await load(
    `apps/extension/src/features/${{ open: "requests/request-panel", sidbar: "sidebar/sidebar", importData: "import/import-data" }[file]}-handler.ts`,
    dependencies,
  );
  const handler =
    exports.handleMessage ||
    exports.handleRequestPanelCommand ||
    exports.handelImportDataMessage;
  return {
    calls,
    editor,
    config,
    panel,
    rows: () => rows,
    replace: (list) => {
      rows = list;
    },
    switchProject: () => {
      project = "two";
    },
    run: (action, data) => handler({ action, data }, context, editor, {}),
  };
}
for (const succeeds of [true, false]) {
  test(`bulk list replacement handles storage result ${succeeds} before updating views`, async () => {
    const f = await fixture("sidbar", { succeeds });
    await f.run("setApiList", [{ id: "request", name: "Updated" }]);
    assert.equal(f.calls[0][0], "write");
    if (!succeeds)
      assert.deepEqual(
        f.calls.map(([name]) => name),
        ["write", "error"],
      );
    else
      assert.deepEqual(
        f.calls.map(([name]) => name),
        ["write", "open", "share"],
      );
  });
  test(`folder deletion handles storage result ${succeeds} before closing tabs or deleting tests`, async () => {
    const f = await fixture("sidbar", { succeeds });
    await f.run("showConfirmation", { id: "folder", title: "Delete?" });
    assert.equal(f.calls[0][0], "write");
    if (!succeeds) {
      assert.deepEqual(
        f.calls.map(([name]) => name),
        ["write", "error"],
      );
      assert.equal(f.rows().length, 3);
    } else {
      assert.deepEqual(
        f.rows().map((item) => item.id),
        ["other"],
      );
      assert.ok(f.calls.find(([name]) => name === "dispose"));
      assert.ok(f.calls.find(([name]) => name === "deleteTest"));
    }
  });
}
test("delete confirmation preserves concurrent edits and aborts after a workspace switch", async () => {
  let f;
  f = await fixture("sidbar", {
    confirmation: () => {
      f.replace([
        ...f.rows(),
        { id: "concurrent", parentId: "0", kind: "api" },
      ]);
      return "Yes";
    },
  });
  await f.run("showConfirmation", { id: "folder" });
  assert.deepEqual(
    f.rows().map((item) => item.id),
    ["other", "concurrent"],
  );
  f = await fixture("sidbar", {
    confirmation: () => {
      f.switchProject();
      return "Yes";
    },
  });
  await f.run("showConfirmation", { id: "folder" });
  assert.deepEqual(f.calls, []);
});
for (const [after, before, expected] of [
  ["0", "0", ["folder", "other", "request"]],
  ["0", "folder", ["folder", "request", "other"]],
  ["folder", "0", ["request", "folder", "other"]],
]) {
  test(`drop ${after}/${before} orders siblings and updates panels only after save`, async () => {
    for (const succeeds of [true, false]) {
      const f = await fixture("sidbar", { succeeds });
      await f.run("onDrop", {
        ids: ["request"],
        parentId: "0",
        after_id: after,
        before_id: before,
      });
      assert.equal(f.calls[0][0], "write");
      if (!succeeds)
        assert.deepEqual(
          f.calls.map(([name]) => name),
          ["write", "error"],
        );
      else {
        assert.deepEqual(
          f
            .rows()
            .filter((item) => item.parentId === "0")
            .sort((a, b) => a.sort - b.sort)
            .map((item) => item.id),
          expected,
        );
        assert.equal(f.calls.at(-1)[0], "success");
      }
    }
  });
}
test("import storage failures keep the import panel open and never report complete success", async () => {
  const f = await fixture("importData", { environmentSucceeds: false });
  await f.run("importPostmanCollection", {
    collection: { info: { name: "Native" }, item: [] },
  });
  assert.deepEqual(
    f.calls.map(([name]) => name),
    ["writeEnv", "import"],
  );
  assert.equal(f.calls.at(-1)[1].action, "postmanImportError");
  assert.match(f.calls.at(-1)[1].data, /Failed to save collection/);
});
test("successful native import broadcasts only after the collection write", async () => {
  const f = await fixture("importData");
  await f.run("importPostmanCollection", {
    collection: { info: { name: "Native" }, item: [] },
  });
  assert.deepEqual(
    f.calls.map(([name]) => name),
    ["writeEnv", "write", "import"],
  );
  assert.equal(f.calls.at(-1)[1].action, "postmanImportComplete");
});
test("folder rename updates open test titles only after the saved message commits", async () => {
  for (const succeeds of [true, false]) {
    const f = await fixture("sidbar", { succeeds });
    const testPanel = f.panel("test");
    f.config.openedFolderTestPanels.folder = testPanel;
    await f.run("saveFolder", { ...f.rows()[0], name: "Renamed" });
    assert.equal(f.calls[0][0], "write");
    if (succeeds) assert.equal(testPanel.title, "Renamed");
    else {
      assert.equal(testPanel.title, "Unsaved ⚈");
      assert.deepEqual(
        f.calls.map(([name]) => name),
        ["write", "error"],
      );
    }
  }
});
test("folder test cleanup runs once per deletion and reports partial cleanup failure", async () => {
  const f = await fixture("sidbar", { cleanupSucceeds: false });
  await f.run("showConfirmation", { id: "folder" });
  assert.deepEqual(
    f.rows().map((item) => item.id),
    ["other"],
  );
  assert.deepEqual(
    f.calls.filter(([name]) => name === "deleteTest"),
    [["deleteTest", ["folder", "request"]]],
  );
  assert.match(
    f.calls.find(([name]) => name === "error")[1],
    /deleted.*test data/,
  );
});
test("batch test cleanup writes once and propagates the storage result", async () => {
  for (const result of [true, false]) {
    const writes = [];
    const { deleteTestingFoldersData } = await load(
      "apps/extension/src/features/testing/report-storage.ts",
      (id) => {
        if (id === "./index" || /\/storage(?:\/index)?$/.test(id))
          return {
            setDataToGlobalStorage: unused,
            getDataFromGlobalStorage: () => ({
              folder: {},
              request: {},
              keep: { data: "retained" },
            }),
            updateDataInGlobalStorage: (_, key, change) => {
              const value = change({
                folder: {},
                request: {},
                keep: { data: "retained" },
              });
              writes.push([key, plain(value)]);
              return result;
            },
          };
        return (
          requestPanelStubs[id] ?? (id === "vscode" ? {} : nativeDependency(id))
        );
      },
    );
    const context = {
      globalState: { get: () => ({ currentProject: { project_id: "one" } }) },
    };
    assert.equal(
      await deleteTestingFoldersData(["folder", "request"], context),
      result,
    );
    assert.equal(writes.length, 1);
    assert.deepEqual(writes[0][1], { keep: { data: "retained" } });
  }
});

test("preview import failures are returned to the panel instead of leaving it loading", async () => {
  const f = await fixture("importData");
  await f.run("getImportData", { json: {}, fileType: "unsupported" });
  assert.equal(f.calls.at(-1)[1].action, "importError");
  assert.match(f.calls.at(-1)[1].data, /Unsupported import format/);
});

for (const failure of ["environment", "requests"]) {
  test(`preview import retains the panel when saving ${failure} fails`, async () => {
    const f = await fixture("importData", {
      environmentSucceeds: failure !== "environment",
      succeeds: failure !== "requests",
    });
    await f.run("importData", {
      newApis: [{ id: "imported", kind: "api", parentId: "0" }],
    });
    assert.equal(f.calls.at(-1)[1].action, "importError");
    assert.match(f.calls.at(-1)[1].data, /Failed to save imported/);
    assert.equal(
      f.calls.some(([name]) => name === "dispose" || name === "success"),
      false,
    );
    assert.equal(
      f.rows().some((row) => row.id === "imported"),
      false,
    );
  });
}

test("preview import acknowledges and closes only after the request write finishes", async () => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  let started;
  const writing = new Promise((resolve) => {
    started = resolve;
  });
  const f = await fixture("importData", { writeGate: gate, onWrite: started });
  const save = f.run("importData", {
    newApis: [{ id: "imported", kind: "api", parentId: "0" }],
  });
  await writing;
  assert.equal(
    f.calls.some(
      ([name]) => name === "dispose" || name === "success" || name === "import",
    ),
    false,
  );
  release();
  await save;
  assert.equal(f.calls.at(-2)[1].action, "importComplete");
  assert.deepEqual(f.calls.at(-1), ["dispose", "import"]);
});

for (const closeAllowed of [false, true]) {
  test(`workspace switch respects native dirty tab close result ${closeAllowed}`, async () => {
    const f = await fixture("sidbar", { closeAllowed });
    await f.run("switchProject", {
      team: { team_id: "team" },
      project: { project_id: "two" },
    });
    assert.equal(f.calls[0][0], "close-tabs");
    assert.equal(
      f.calls.some(([name]) => name === "dispose"),
      closeAllowed,
    );
    assert.equal(
      f.calls.some(([name]) => name === "switch-workspace"),
      closeAllowed,
    );
  });
}
