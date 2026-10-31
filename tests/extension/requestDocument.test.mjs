import { requestPanelStubs } from "../helpers/requestPanelStubs.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";

const plain = (value) => JSON.parse(JSON.stringify(value));
const original = {
  id: "request",
  parentId: "folder",
  kind: "api",
  name: "Original",
  request: { method: "GET", url: "https://example.com" },
};
const token = { isCancellationRequested: false };
const uri = (text) => ({ scheme: text.split(":")[0], toString: () => text });
async function fixture({
  saved = true,
  gate,
  succeeds = true,
  file = false,
  record = original,
} = {}) {
  let rows = saved ? [structuredClone(record)] : [],
    activeWorkspace = "one";
  const calls = [],
    events = [],
    files = new Map(),
    disposals = [];
  const resource = uri(
    file
      ? "file:/request.onapi.json"
      : "onapi-editor://onapi.request/one/request",
  );
  class CancellationError extends Error {}
  class FileSystemError extends Error {}
  class EventEmitter {
    listeners = [];
    event = (callback) => {
      this.listeners.push(callback);
      return { dispose() {} };
    };
    fire = (event) => this.listeners.forEach((callback) => callback(event));
    dispose() {}
  }
  const host = {
    EventEmitter,
    CancellationError,
    FileSystemError,
    Uri: { parse: uri },
    workspace: {
      async save(target) {
        calls.push(["save", target.toString()]);
        await document.save(token);
        return target;
      },
      fs: {
        async writeFile(target, bytes) {
          files.set(target.toString(), new Uint8Array(bytes));
        },
        async readFile(target) {
          if (!files.has(target.toString())) throw new Error("Missing file");
          return files.get(target.toString());
        },
        async delete(target) {
          files.delete(target.toString());
        },
      },
    },
  };
  const context = { subscriptions: [] };
  let storage;
  const dependencies = (id) => {
    if (id.endsWith("/custom-editor")) return { openCustomEditor() {} };
    if (id === "./request-storage")
      return { ...storage, getApiListName: () => activeWorkspace };
    if (id.endsWith("/storage/index"))
      return {
        getStorageError: () => undefined,
        getDataFromGlobalStorage: () => structuredClone(rows),
        setDataToGlobalStorage() {},
        updateDataInGlobalStorage: async (_, workspace, change) => {
          calls.push(["write", workspace]);
          if (gate) await gate;
          if (!succeeds) return false;
          rows = plain(change(structuredClone(rows)));
          return true;
        },
      };
    if (id === "./request-panel-handler")
      return { handleRequestPanelCommand() {} };
    if (id.endsWith("/project-config"))
      return { getCurrentProjectConfig: () => ({}), setProjectConfig() {} };
    if (id.endsWith("/create-panel")) return { setupFeatureWebview() {} };
    if (id === "vscode") return host;
    if (id.endsWith("/request-panel-channel"))
      return {
        ...requestPanelStubs["../../platform/webviews/request-panel-channel"],
        postRequestPanelResponse: async (_, message) =>
          calls.push(["message", plain(message)]),
      };
    if (id.endsWith("/config"))
      return {
        DEFAULT_TARGET_NAME: { api: "HTTP Request" },
        PANEL_OPTIONS: { OPEN: { title: "Request" } },
        globalConfig: { openedPanels: {} },
      };
    if (id.endsWith("/host-utils")) return { showTabName: (value) => value };
    if (id.endsWith("/protocol-icon"))
      return { getProtocolIcon: () => undefined };
    if (id.endsWith("/collection-order")) return { getMaxSort: () => 2 };
    if (id.endsWith("/storage"))
      return {
        getStorageError: () => undefined,
        getDataFromGlobalStorage: () => structuredClone(rows),
      };
    if (id === "../sharing/share-data")
      return {
        ...requestPanelStubs[id],
        getProjectShareData: () => ({}),
        setProjectShareData() {},
        getDocBaseUrl: () => "",
      };
    if (id === "./request-status")
      return {
        setRequestDraft: (...args) => calls.push(["draft", ...plain(args)]),
      };
    return requestPanelStubs[id] ?? nativeDependency(id);
  };
  storage = await load(
    "apps/extension/src/features/requests/request-storage.ts",
    dependencies,
    { TextEncoder, TextDecoder },
  );
  const view = await load(
    "apps/extension/src/features/requests/request-editor.ts",
    dependencies,
    { console },
  );
  const model = await load(
    "apps/extension/src/features/requests/request-document.ts",
    dependencies,
    { TextEncoder, TextDecoder, console },
  );
  const document = new model.RequestDocument(
    resource,
    context,
    "one",
    record,
    saved ? record : undefined,
    (event) => events.push(event),
  );
  const panel = {
    title: "Original",
    webview: {},
    onDidDispose: (callback) => disposals.push(callback),
  };
  view.bindRequestDocument(document, panel);
  if (file)
    files.set(
      resource.toString(),
      new TextEncoder().encode(JSON.stringify(record)),
    );
  calls.length = 0;
  const providerModule = await load(
    "apps/extension/src/features/requests/request-editor-provider.ts",
    (id) => {
      if (id === "./request-document") return model;
      if (id.endsWith("/custom-editor"))
        return {
          getEditorInput: () => ({
            workspace: activeWorkspace,
            data: record,
          }),
          setEditorInput: async (_context, _uri, input) =>
            calls.push(["reference", plain(input)]),
        };
      if (id === "./request-editor") return { resolveRequestEditor() {} };
      return dependencies(id);
    },
    { TextEncoder, TextDecoder, console },
  );
  const provider = new providerModule.RequestEditorProvider(context);
  return {
    dependencies,
    ...model,
    ...view,
    context,
    host,
    document,
    panel,
    events,
    calls,
    files,
    provider,
    resource,
    CancellationError,
    rows: () => rows,
    replace: (data) => {
      rows = data;
    },
    setSuccess: (value) => {
      succeeds = value;
    },
    switchWorkspace: () => {
      activeWorkspace = "two";
    },
    close: () => {
      disposals.forEach((dispose) => dispose());
      document.dispose();
    },
  };
}

test("edits notify the native host without writing, timers or custom dirty title markers", async () => {
  const f = await fixture();
  f.document.edit({ ...original, name: "Changed" });
  assert.equal(f.events.length, 1);
  assert.equal(f.events[0].document, f.document);
  assert.equal(f.document.dirty, true);
  assert.equal(f.panel.title, "Changed");
  assert.ok(!f.calls.some(([name]) => name === "write"));
  f.document.edit({ ...original, name: "Changed", is_changed: true });
  assert.equal(f.events.length, 1);
});

test("native undo and redo restore the model and Webview without adding edits", async () => {
  const f = await fixture();
  f.document.edit({ ...original, name: "Changed" });
  await f.events[0].undo();
  assert.equal(f.document.dirty, false);
  assert.equal(f.document.draft.name, "Original");
  await f.events[0].redo();
  assert.equal(f.document.draft.name, "Changed");
  assert.equal(f.events.length, 1);
  assert.equal(f.calls.at(-1)[1].action, "setApiData");
});

test("native save commits before acknowledging and clears the baseline", async () => {
  const f = await fixture();
  f.document.edit({ ...original, name: "Saved" });
  await f.provider.saveCustomDocument(f.document, token);
  assert.equal(f.rows()[0].name, "Saved");
  assert.equal(f.document.dirty, false);
  assert.equal(
    f.calls.filter(([name]) => name === "message").at(-1)[1].action,
    "requestSaved",
  );
});

test("toolbar save targets its resource using workspace.save", async () => {
  const f = await fixture();
  const { handleRequestPanelCommand } = await load(
    "apps/extension/src/features/requests/request-panel-handler.ts",
    (id) => {
      if (id === "vscode") return f.host;
      if (id.endsWith("/panel-actions"))
        return { handlePanelAction: () => false };
      return f.dependencies(id);
    },
  );
  await handleRequestPanelCommand(
    { action: "saveApiData", data: { ...original, name: "Toolbar" } },
    f.context,
    f.panel,
    f.document,
  );
  assert.ok(
    f.calls.some(
      (call) => call[0] === "save" && call[1] === f.resource.toString(),
    ),
  );
  assert.equal(f.rows()[0].name, "Toolbar");
});

test("save failure rejects to VS Code and retains the unsaved draft", async () => {
  const f = await fixture({ succeeds: false });
  f.document.edit({ ...original, name: "Keep me" });
  await assert.rejects(
    f.provider.saveCustomDocument(f.document, token),
    /Failed to save/,
  );
  assert.equal(f.document.dirty, true);
  assert.equal(f.rows()[0].name, "Original");
  assert.ok(
    !f.calls.some(
      (call) => call[0] === "message" && call[1].action === "requestSaved",
    ),
  );
  f.setSuccess(true);
  await f.provider.saveCustomDocument(f.document, token);
  assert.equal(f.document.dirty, false);
});

test("an edit arriving during save remains unsaved after the earlier snapshot commits", async () => {
  let release;
  const f = await fixture({
    gate: new Promise((resolve) => {
      release = resolve;
    }),
  });
  f.document.edit({ ...original, name: "Older" });
  const saving = f.document.save(token);
  await Promise.resolve();
  await Promise.resolve();
  f.document.edit({ ...original, name: "Newer" });
  release();
  await saving;
  assert.equal(f.rows()[0].name, "Older");
  assert.equal(f.document.draft.name, "Newer");
  assert.equal(f.document.dirty, true);
  await f.document.save(token);
  assert.equal(f.rows()[0].name, "Newer");
});

test("native revert reads storage and restores the Webview without saving the discarded edit", async () => {
  const f = await fixture();
  f.document.edit({ ...original, name: "Discard" });
  await f.provider.revertCustomDocument(f.document, token);
  assert.equal(f.document.draft.name, "Original");
  assert.equal(f.document.dirty, false);
  assert.equal(f.calls.at(-1)[1].action, "setApiData");
  assert.ok(!f.calls.some(([name]) => name === "write"));
});

test("closing or disposing a dirty document never forces a save", async () => {
  const f = await fixture();
  f.document.edit({ ...original, name: "Discard" });
  f.close();
  assert.equal(f.rows()[0].name, "Original");
  assert.ok(!f.calls.some(([name]) => name === "write"));
});

test("hot-exit backup restores unsaved data and its saved baseline independently of input snapshots", async () => {
  const f = await fixture();
  f.document.edit({ ...original, name: "Recovered" });
  const backup = await f.provider.backupCustomDocument(
    f.document,
    { destination: uri("file:/backup") },
    token,
  );
  assert.equal(f.rows()[0].name, "Original");
  const restored = await f.provider.openCustomDocument(
    f.resource,
    { backupId: backup.id },
    token,
  );
  assert.equal(restored.draft.name, "Recovered");
  assert.equal(restored.baseline.name, "Original");
  assert.equal(restored.dirty, true);
  await f.provider.saveCustomDocument(restored, token);
  assert.equal(f.rows()[0].name, "Recovered");
  backup.delete();
  assert.equal(f.files.has(backup.id), false);
  restored.dispose();
});

test("save as writes a standalone request and its provider can reopen, edit and save it", async () => {
  const f = await fixture();
  f.document.edit({ ...original, name: "Export" });
  const destination = uri("file:/export.onapi.json");
  await f.provider.saveCustomDocumentAs(f.document, destination, token);
  assert.equal(f.rows()[0].name, "Original");
  const exported = await f.provider.openCustomDocument(destination, {}, token);
  exported.edit({ ...exported.draft, name: "File edit" });
  await f.provider.saveCustomDocument(exported, token);
  assert.equal(
    JSON.parse(new TextDecoder().decode(f.files.get(destination.toString())))
      .name,
    "File edit",
  );
  assert.equal(f.rows()[0].name, "Original");
  exported.dispose();
});

test("cancelled save, revert and backup reject without mutating persisted data", async () => {
  const f = await fixture();
  const cancelled = { isCancellationRequested: true };
  f.document.edit({ ...original, name: "Cancelled" });
  await assert.rejects(f.document.save(cancelled), f.CancellationError);
  await assert.rejects(f.document.revert(cancelled), f.CancellationError);
  await assert.rejects(
    f.provider.backupCustomDocument(
      f.document,
      { destination: uri("file:/backup") },
      cancelled,
    ),
    f.CancellationError,
  );
  assert.equal(f.rows()[0].name, "Original");
  assert.equal(f.files.size, 0);
});

test("workspace changes do not redirect writes and deleted requests cannot be resurrected", async () => {
  const f = await fixture();
  f.document.edit({ ...original, name: "Changed" });
  f.switchWorkspace();
  await f.document.save(token);
  assert.ok(f.calls.some((call) => call[0] === "write" && call[1] === "one"));
  f.replace([]);
  await assert.rejects(f.document.save(token), /removed/);
  f.discardRequestDocuments("one", [original.id]);
  await assert.rejects(f.document.save(token), /deleted/);
});

test("new requests use native dirty events and are inserted on their first native save", async () => {
  const f = await fixture({ saved: false });
  f.document.announceInitialChange();
  assert.equal(f.events.length, 1);
  assert.equal(f.document.dirty, true);
  await f.document.save(token);
  assert.equal(f.rows()[0].id, original.id);
  assert.equal(f.document.dirty, false);
});

test("persisted external updates refresh clean models while retaining dirty drafts", async () => {
  const f = await fixture();
  f.syncRequestDocument(f.panel, { ...original, name: "External" });
  assert.equal(f.document.draft.name, "External");
  assert.equal(f.document.dirty, false);
  f.document.edit({ ...original, name: "My edit" });
  f.syncRequestDocument(f.panel, {
    ...original,
    name: "Another external edit",
  });
  assert.equal(f.document.draft.name, "My edit");
});

test("a restored dirty document does not add a synthetic edit on resolve", async () => {
  const f = await fixture();
  f.document.edit({ ...original, name: "Backup edit" });
  const backup = await f.provider.backupCustomDocument(
    f.document,
    { destination: uri("file:/backup") },
    token,
  );
  const restored = await f.provider.openCustomDocument(
    f.resource,
    { backupId: backup.id },
    token,
  );
  const events = [];
  f.provider.onDidChangeCustomDocument((event) => events.push(event));
  f.provider.resolveCustomEditor(restored, f.panel, token);
  await Promise.resolve();
  assert.equal(events.length, 0);
  restored.edit({ ...restored.draft, name: "More edits" });
  assert.equal(events.length, 1);
  restored.dispose();
});

test("provider opens existing resources clean and announces new resources once", async () => {
  for (const saved of [true, false]) {
    const f = await fixture({ saved });
    const doc = await f.provider.openCustomDocument(f.resource, {}, token);
    const events = [];
    f.provider.onDidChangeCustomDocument((event) => events.push(event));
    f.provider.resolveCustomEditor(doc, f.panel, token);
    await Promise.resolve();
    assert.equal(events.length, saved ? 0 : 1);
    doc.dispose();
  }
});

test("file-backed revert reloads the current file rather than writing to repository storage", async () => {
  const f = await fixture({ file: true });
  f.document.edit({ ...original, name: "Discard" });
  f.files.set(
    f.resource.toString(),
    new TextEncoder().encode(
      JSON.stringify({ ...original, name: "External file" }),
    ),
  );
  await f.document.revert(token);
  assert.equal(f.document.draft.name, "External file");
  assert.equal(f.document.dirty, false);
  assert.equal(f.rows()[0].name, "Original");
});

test("undoing new request content returns to an empty clean request and redo restores content", async () => {
  const f = await fixture({ saved: false });
  f.document.announceInitialChange();
  const initial = f.events[0];
  await initial.undo();
  assert.equal(f.document.dirty, false);
  assert.equal(f.document.draft.name, "");
  assert.notEqual(f.document.draft.request?.url, original.request.url);
  assert.equal(f.rows().length, 0);
  await initial.redo();
  assert.equal(f.document.draft.name, original.name);
  assert.equal(f.document.draft.request.url, original.request.url);
  assert.equal(f.document.dirty, true);
});

test("edit history shares unchanged branches, owns changed inputs and preserves undo", async () => {
  const f = await fixture();
  f.document.edit({
    ...original,
    variable: [{ key: "large", value: "x".repeat(100000) }],
  });
  const before = f.document.draft;
  const incoming = structuredClone(before);
  incoming.name = "Renamed";
  f.document.edit(incoming);
  const after = f.document.draft;
  assert.equal(after.request, before.request);
  assert.equal(after.variable, before.variable);
  incoming.variable[0].value = "Mutated caller";
  assert.equal(after.variable[0].value.length, 100000);
  await f.events.at(-1).undo();
  assert.equal(f.document.draft, before);
  await f.events.at(-1).redo();
  assert.equal(f.document.draft, after);
});

test("compact saved references cannot recreate a request removed from storage", async () => {
  const f = await fixture();
  const { RequestEditorProvider } = await load(
    "apps/extension/src/features/requests/request-editor-provider.ts",
    (id) => {
      if (id.endsWith("/custom-editor"))
        return {
          getEditorInput: () => ({
            workspace: "one",
            data: { id: original.id },
          }),
          setEditorInput: async () => {},
        };
      if (id === "./request-document")
        return { RequestDocument: f.RequestDocument };
      if (id === "./request-editor") return { resolveRequestEditor() {} };
      return f.dependencies(id);
    },
    { TextEncoder, TextDecoder, console },
  );
  const provider = new RequestEditorProvider(f.context);
  const opened = await provider.openCustomDocument(f.resource, {}, token);
  assert.equal(opened.dirty, false);
  opened.dispose();
  f.replace([]);
  await assert.rejects(
    provider.openCustomDocument(f.resource, {}, token),
    /removed/,
  );
});

test("first native save replaces a new-request recovery payload with a compact reference", async () => {
  const f = await fixture({ saved: false });
  await f.provider.saveCustomDocument(f.document, token);
  const reference = f.calls.find(([name]) => name === "reference")[1];
  assert.deepEqual(reference.data, { id: original.id });
  assert.equal(reference.workspace, "one");
});

test("undo and redo keep the native save point after persistence adds metadata", async () => {
  const f = await fixture({ saved: false });
  f.document.announceInitialChange();
  await f.document.save(token);
  assert.equal(f.document.dirty, false);
  await f.events[0].undo();
  assert.equal(f.document.dirty, true);
  await f.events[0].redo();
  assert.equal(f.document.dirty, false);
});

test("backup preserves native dirtiness even when typing returns to the original value", async () => {
  const f = await fixture();
  f.document.edit({ ...original, name: "Temporary" });
  f.document.edit(original);
  assert.equal(f.document.dirty, true);
  const backup = await f.provider.backupCustomDocument(
    f.document,
    { destination: uri("file:/backup") },
    token,
  );
  const restored = await f.provider.openCustomDocument(
    f.resource,
    { backupId: backup.id },
    token,
  );
  assert.equal(restored.dirty, true);
  restored.dispose();
});

for (const kind of ["ai", "mcp"]) {
  test(`${kind} native document preserves raw drafts through save, undo, redo and revert`, async () => {
    const record = {
      id: "request",
      parentId: "folder",
      kind,
      name: "Protocol",
      ...(kind === "ai"
        ? { ai: { model: "test" } }
        : { mcp: { transport: "stdio", command: "node", args: [] } }),
    };
    const f = await fixture({ record });
    const edited = {
      ...record,
      draft: { headersText: '{"unfinished', argsText: '["server.js"]' },
    };
    f.document.edit(edited);
    assert.equal(f.document.dirty, true);
    const change = f.events.at(-1);
    change.undo();
    assert.equal(f.document.draft.draft, undefined);
    change.redo();
    assert.equal(f.document.draft.draft.headersText, '{"unfinished');
    await f.document.save(token);
    assert.equal(f.rows()[0].draft.argsText, '["server.js"]');
    f.document.edit({ ...edited, draft: { headersText: "changed" } });
    await f.document.revert(token);
    assert.equal(f.document.draft.draft.headersText, '{"unfinished');
    assert.equal(f.document.dirty, false);
  });
}
