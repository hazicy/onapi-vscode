import { test } from "node:test";
import assert from "node:assert/strict";
import load from "./helpers/loadTypeScript.mjs";
import { nativeDependency } from "./helpers/loadTypeScript.mjs";
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
  } = {},
) {
  const calls = [];
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
    pushWebView: panel("push"),
    shareListWebView: panel("share"),
    importDataWebView: panel("import"),
    openedPanels: { request: editor },
    openedFolderTestPanels: {},
  };
  const tree = await load(
    "apps/extension/src/features/collections/collection-tree.ts",
    () => ({}),
  );
  const exports = await load(
    `apps/extension/src/features/${{ open: "requests/open", sidbar: "sidebar/sidebar", importData: "import/import-data" }[file]}-handler.ts`,
    (id) => {
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
          getApiList: () => structuredClone(rows),
          getApiListName: () => project,
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
          setProjectApisVersion: () => calls.push(["version"]),
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
          getProjectShareData: () => {
            calls.push(["shareRead"]);
            return {};
          },
        };
      if (id === "@/features/requests/utils/apis")
        return { createBatchApi: (items) => items };
      if (id === "vscode")
        return {
          window: {
            showInputBox: async () => "Renamed",
            showErrorMessage: (message) => calls.push(["error", message]),
            showInformationMessage: async (message, options) => {
              if (options?.modal) return confirmation ? confirmation() : "Yes";
              calls.push(["success", message]);
            },
          },
        };
      return {};
    },
  );
  const handler =
    exports.handleMessage ||
    exports.handelOpenMessage ||
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
    run: (action, data) => handler({ action, data }, {}, editor, {}),
  };
}
test("editor save failure preserves dirty title and input and sends no saved-state updates", async () => {
  const f = await fixture("open", { succeeds: false });
  const input = {
    id: "request",
    kind: "api",
    name: "",
    is_create: 1,
  };
  const snapshot = structuredClone(input);
  await f.run("saveApiData", input);
  assert.deepEqual(input, snapshot);
  assert.equal(f.editor.title, "Unsaved ⚈");
  assert.deepEqual(
    f.calls.map(([name]) => name),
    ["write", "error"],
  );
});
test("editor save commits before clearing dirty state, broadcasting or reporting success", async () => {
  const f = await fixture("open");
  await f.run("saveApiData", {
    id: "request",
    kind: "api",
    name: "Renamed",
  });
  assert.equal(f.calls[0][0], "write");
  assert.equal(f.editor.title, "Renamed");
  assert.equal(f.rows()[1].is_create, undefined);
  assert.equal(f.calls.at(-1)[0], "success");
});
test("HTTP edits persist the latest content without resetting the editor or showing a success popup", async () => {
  const f = await fixture("open");
  for (const url of ["https://example.com/a", "https://example.com/ab"]) {
    await f.run("updateApiActiveData", {
      id: "request",
      kind: "api",
      name: "Original",
      url,
    });
  }
  assert.equal(f.rows()[1].url, "https://example.com/ab");
  assert.equal(f.rows()[1].is_changed, undefined);
  assert.equal(f.editor.title, "Original");
  assert.ok(!f.calls.some(([name]) => name === "success"));
  assert.ok(
    f.calls
      .filter(([name]) => name === "editor")
      .every(([, message]) => message.action === "requestSaved"),
  );
});
test("failed HTTP autosave keeps stored content and marks the editor dirty", async () => {
  const f = await fixture("open", { succeeds: false });
  await f.run("updateApiActiveData", {
    id: "request",
    kind: "api",
    name: "Changed",
    url: "https://example.com",
  });
  assert.equal(f.rows()[1].name, "Original");
  assert.equal(f.editor.title, "Changed ⚈");
  assert.deepEqual(
    f.calls.map(([name]) => name),
    ["write", "error"],
  );
});
for (const succeeds of [true, false]) {
  test(`bulk list replacement handles storage result ${succeeds} before updating versions and views`, async () => {
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
        ["write", "version", "editor", "push", "share"],
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
        return {};
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

test("editor success and saved baseline wait for the actual asynchronous commit", async () => {
  let release, started;
  const gate = new Promise((resolve) => (release = resolve));
  const entered = new Promise((resolve) => (started = resolve));
  const f = await fixture("open", { writeGate: gate, onWrite: started });
  const pending = f.run("saveApiData", {
    id: "request",
    kind: "api",
    name: "Edited",
  });
  await entered;
  assert.equal(f.rows()[1].name, "Original");
  assert.equal(f.editor.title, "Edited ⚈");
  assert.deepEqual(
    f.calls.map(([name]) => name),
    ["write"],
  );
  release();
  await pending;
  assert.equal(f.rows()[1].name, "Edited");
  assert.equal(f.editor.title, "Edited");
  assert.equal(
    f.calls.find(([name]) => name === "editor")[1].action,
    "requestSaved",
  );
  assert.equal(f.calls.at(-1)[0], "success");
});
