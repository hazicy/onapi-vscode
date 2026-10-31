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
  } = {},
) {
  const calls = [];
  const titles = [];
  const workspaces = [];
  const timers = new Map();
  let clock = 0,
    timerId = 0;
  const advance = async (milliseconds) => {
    clock += milliseconds;
    for (const [id, timer] of [...timers]) {
      if (timer.at <= clock) {
        timers.delete(id);
        await timer.callback();
      }
    }
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
  let title = editor.title;
  Object.defineProperty(editor, "title", {
    get: () => title,
    set: (value) => {
      title = value;
      titles.push(value);
    },
  });
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
  let autosave;
  const dependencies = (id) => {
    if (id.endsWith("/request-autosave")) return autosave;

    if (id === "node:timers")
      return {
        setTimeout: (callback, delay) => {
          const id = ++timerId;
          timers.set(id, { callback, at: clock + delay });
          return id;
        },
        clearTimeout: (id) => timers.delete(id),
      };
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
          workspaces.push(workspace);
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
        window: {
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
  autosave = await load(
    "apps/extension/src/features/requests/request-autosave.ts",
    dependencies,
  );
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
    titles,
    advance,
    pendingTimers: () => timers.size,
    close: () => autosave.closeRequestAutosave(editor),
    shutdown: () => autosave.flushAllRequestAutosaves(),
    discard: (ids) => autosave.discardRequestAutosaves("one", ids),
    draft: () => autosave.getRequestAutosaveDraft("one", "request"),
    reopen: () => autosave.attachRequestAutosave({}, editor, rows[1]),
    workspaces,
    edit: (data) => autosave.updateRequestDraft({}, editor, data),
    setWriteResult: (value) => {
      succeeds = value;
    },
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
  assert.equal(f.editor.title, "HTTP Request ⚈");
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
  assert.equal(f.calls.filter(([name]) => name === "write").length, 0);
  assert.equal(f.editor.title, "Original ⚈");
  await f.advance(599);
  assert.equal(f.calls.filter(([name]) => name === "write").length, 0);
  await f.advance(1);
  assert.equal(f.calls.filter(([name]) => name === "write").length, 1);
  assert.deepEqual(f.titles, ["Original ⚈", "Original"]);
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
  await f.advance(600);
  assert.equal(f.rows()[1].name, "Original");
  assert.equal(f.editor.title, "Changed ⚈");
  assert.deepEqual(
    f.calls.map(([name]) => name),
    ["write", "error"],
  );
});
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
        ["write", "editor", "share"],
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

for (const kind of [
  "api",
  "graphql",
  "sse",
  "websocket",
  "socketio",
  "folder",
]) {
  test(`${kind} drafts autosave after typing stops`, async () => {
    const f = await fixture("open");
    await f.run("updateApiActiveData", { id: "request", kind, name: "Edited" });
    await f.advance(500);
    await f.run("updateApiActiveData", { id: "request", kind, name: "Latest" });
    await f.advance(599);
    assert.equal(f.calls.filter(([name]) => name === "write").length, 0);
    assert.equal(f.editor.title, "Latest ⚈");
    await f.advance(1);
    assert.equal(f.rows()[1].name, "Latest");
    assert.equal(f.editor.title, "Latest");
    assert.equal(f.calls.filter(([name]) => name === "write").length, 1);
    assert.ok(!f.calls.some(([name]) => name === "success"));
  });
}

test("manual save writes immediately and cancels the queued autosave", async () => {
  const f = await fixture("open");
  const draft = { id: "request", kind: "api", name: "Manual" };
  await f.run("updateApiActiveData", draft);
  await f.run("saveApiData", draft);
  assert.equal(f.rows()[1].name, "Manual");
  assert.equal(f.pendingTimers(), 0);
  await f.advance(600);
  assert.equal(f.calls.filter(([name]) => name === "write").length, 1);
});

test("a newer edit keeps its dirty marker when an older write finishes", async () => {
  let release, entered;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const started = new Promise((resolve) => {
    entered = resolve;
  });
  const f = await fixture("open", { writeGate: gate, onWrite: entered });
  await f.run("updateApiActiveData", {
    id: "request",
    kind: "api",
    name: "Older",
  });
  const firstSave = f.advance(600);
  await started;
  await f.run("updateApiActiveData", {
    id: "request",
    kind: "api",
    name: "Newer",
  });
  release();
  await firstSave;
  assert.equal(f.editor.title, "Newer ⚈");
  assert.equal(f.draft().name, "Newer");
  await f.advance(600);
  assert.equal(f.editor.title, "Newer");
  assert.equal(f.rows()[1].name, "Newer");
});

test("closing a panel flushes its queued draft without updating a disposed webview", async () => {
  const f = await fixture("open");
  await f.run("updateApiActiveData", {
    id: "request",
    kind: "socketio",
    name: "Before close",
  });
  await f.close();
  assert.equal(f.rows()[1].name, "Before close");
  assert.equal(f.pendingTimers(), 0);
  assert.ok(!f.calls.some(([name]) => name === "editor" || name === "success"));
});

test("deleting a request cancels its autosave before closing the editor", async () => {
  const f = await fixture("open");
  await f.run("updateApiActiveData", {
    id: "request",
    kind: "api",
    name: "Deleted",
  });
  f.replace(f.rows().filter((row) => row.id !== "request"));
  f.discard(["request"]);
  await f.close();
  await f.advance(600);
  assert.ok(!f.rows().some((row) => row.id === "request"));
  assert.equal(f.pendingTimers(), 0);
});

test("an existing request removed externally cannot be reinserted by close", async () => {
  const f = await fixture("open");
  await f.run("updateApiActiveData", {
    id: "request",
    kind: "api",
    name: "Deleted",
  });
  f.replace(f.rows().filter((row) => row.id !== "request"));
  await f.close();
  assert.ok(!f.rows().some((row) => row.id === "request"));
});

test("shutdown flushes drafts still waiting for the debounce timer", async () => {
  const f = await fixture("open");
  await f.run("updateApiActiveData", {
    id: "request",
    kind: "websocket",
    name: "At shutdown",
  });
  await f.shutdown();
  assert.equal(f.rows()[1].name, "At shutdown");
  assert.equal(f.pendingTimers(), 0);
});

test("a failed autosave retains its draft and close retries it", async () => {
  const f = await fixture("open", { succeeds: false });
  await f.run("updateApiActiveData", {
    id: "request",
    kind: "api",
    name: "Keep me",
  });
  await f.advance(600);
  assert.equal(f.draft().name, "Keep me");
  f.setWriteResult(true);
  await f.close();
  assert.equal(f.rows()[1].name, "Keep me");
  assert.equal(f.draft(), undefined);
});

test("a failed close keeps a recoverable draft for the next editor", async () => {
  const f = await fixture("open", { succeeds: false });
  await f.run("updateApiActiveData", {
    id: "request",
    kind: "api",
    name: "Recovered",
  });
  await f.close();
  assert.equal(f.draft().name, "Recovered");
  f.setWriteResult(true);
  f.reopen();
  await f.advance(600);
  assert.equal(f.rows()[1].name, "Recovered");
});

test("project changes never redirect an autosave to the newly selected project", async () => {
  const f = await fixture("open");
  await f.run("updateApiActiveData", {
    id: "request",
    kind: "api",
    name: "Original project",
  });
  f.switchProject();
  await f.advance(600);
  assert.deepEqual(f.workspaces, ["one"]);
  assert.equal(f.rows()[1].name, "Original project");
});

test("sidebar deletion cancels pending drafts so editor disposal cannot restore the request", async () => {
  const f = await fixture("sidbar");
  f.edit({ id: "request", kind: "api", name: "Delete me" });
  await f.run("showConfirmation", { id: "request" });
  await f.close();
  await f.advance(600);
  assert.ok(!f.rows().some((row) => row.id === "request"));
  assert.equal(f.pendingTimers(), 0);
});
