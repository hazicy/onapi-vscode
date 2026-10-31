import { test } from "node:test";
import assert from "node:assert/strict";
import load from "../helpers/loadTypeScript.mjs";

async function fixture() {
  const providers = new Map(),
    opened = [],
    state = new Map();
  let tabsChanged;
  class TabInputCustom {
    constructor(uri) {
      this.uri = uri;
    }
  }
  const context = {
    subscriptions: [],
    workspaceState: {
      get: (key, fallback) => state.get(key) ?? fallback,
      async update(key, value) {
        await Promise.resolve();
        state.set(key, value);
      },
    },
  };
  const api = await load(
    "apps/extension/src/platform/webviews/custom-editor.ts",
    () => ({
      TabInputCustom,
      Uri: {
        from: (parts) => ({
          scheme: parts.scheme,
          toString: () => `${parts.scheme}://${parts.authority}${parts.path}`,
        }),
      },
      ViewColumn: { One: 1 },
      commands: { executeCommand: async (...args) => opened.push(args) },
      window: {
        tabGroups: {
          onDidChangeTabs(callback) {
            tabsChanged = callback;
            return { dispose() {} };
          },
        },
        registerCustomEditorProvider(type, provider, options) {
          providers.set(type, { provider, options });
          return { dispose() {} };
        },
      },
    }),
  );
  return {
    ...api,
    context,
    providers,
    opened,
    state,
    close: (uri) =>
      tabsChanged({ closed: [{ input: new TabInputCustom(uri) }] }),
  };
}

test("stable resources survive provider recreation and isolate workspaces", async () => {
  const f = await fixture(),
    resolved = [];
  let workspace = "project/a";
  const register = () =>
    f.registerCustomEditor(
      f.context,
      {
        viewType: "onapi.request",
        resolve: (...args) => resolved.push(args),
      },
      () => workspace,
    );
  register();
  const input = { workspace, data: { id: "request/one", name: "Draft" } };
  await f.openCustomEditor(f.context, "onapi.request", input.data.id, input);
  await f.openCustomEditor(f.context, "onapi.request", input.data.id, input);
  assert.equal(f.opened[0][0], "vscode.openWith");
  assert.equal(f.opened[0][1].toString(), f.opened[1][1].toString());
  assert.ok(!f.opened[0][1].toString().includes("Draft"));
  register();
  const { provider, options } = f.providers.get("onapi.request");
  assert.equal(options.supportsMultipleEditorsPerDocument, false);
  const document = provider.openCustomDocument(f.opened[0][1]);
  let disposed = 0;
  const panel = { dispose: () => disposed++ };
  provider.resolveCustomEditor(document, panel);
  assert.equal(resolved[0][0].data.name, "Draft");
  workspace = "other-project";
  provider.resolveCustomEditor(document, panel);
  assert.equal(disposed, 1);
  assert.equal(resolved.length, 1);
  provider.resolveCustomEditor({ uri: { toString: () => "missing" } }, panel);
  assert.equal(disposed, 2);
});

test("concurrent opens retain both inputs and unregistered editors cannot open", async () => {
  const f = await fixture();
  await assert.rejects(
    f.openCustomEditor(f.context, "missing", "1", { workspace: "p" }),
    /not registered/,
  );
  f.registerCustomEditor(
    f.context,
    { viewType: "onapi.request", resolve() {} },
    () => "p",
  );
  await Promise.all(
    ["one", "two"].map((id) =>
      f.openCustomEditor(f.context, "onapi.request", id, {
        workspace: "p",
        data: { id },
      }),
    ),
  );
  assert.equal(Object.keys(f.state.get("customEditor.inputs")).length, 2);
  assert.equal(f.opened.length, 2);
});

test("closing a tab removes its persisted snapshot without losing other resources", async () => {
  const f = await fixture();
  f.registerCustomEditor(
    f.context,
    { viewType: "onapi.request", resolve() {} },
    () => "p",
  );
  await f.openCustomEditor(f.context, "onapi.request", "one", {
    workspace: "p",
    data: {},
  });
  f.close(f.opened[0][1]);
  await f.openCustomEditor(f.context, "onapi.request", "two", {
    workspace: "p",
    data: {},
  });
  const keys = Object.keys(f.state.get("customEditor.inputs"));
  assert.equal(keys.length, 1);
  assert.ok(keys[0].endsWith("/two"));
});

// VS Code registers resolver factories by iterating manifest selectors. An empty
// selector leaves openWith without a factory, even when the provider is registered.
test("contributed editors register selectors for virtual resources without matching files", async () => {
  const { readFile } = await import("node:fs/promises");
  const { matchesGlob } = await import("node:path");
  const manifest = JSON.parse(
    await readFile("apps/extension/package.json", "utf8"),
  );
  const f = await fixture();
  for (const editor of manifest.contributes.customEditors) {
    assert.equal(
      editor.priority,
      editor.viewType === "onapi.request" ? "default" : "option",
    );
    assert.ok(
      editor.selector.length > 0,
      `${editor.viewType} needs a resolver registration`,
    );
    f.registerCustomEditor(
      f.context,
      { viewType: editor.viewType, resolve() {} },
      () => "apiList",
    );
    await f.openCustomEditor(f.context, editor.viewType, "18467e35f80002", {
      workspace: "apiList",
      data: {},
    });
    const [, uri, viewType] = f.opened.at(-1);
    assert.equal(viewType, editor.viewType);
    const resource = new URL(uri.toString());
    // VS Code's globMatchesResource uses scheme:path for patterns containing '/'.
    const target = `${resource.protocol}${resource.pathname}`;
    assert.ok(
      editor.selector.some(({ filenamePattern }) =>
        matchesGlob(target, filenamePattern),
      ),
    );
    for (const ordinary of [
      "file:/project/request.json",
      "file:/project/source.ts",
      "untitled:/draft",
    ]) {
      assert.ok(
        editor.selector.every(
          ({ filenamePattern }) => !matchesGlob(ordinary, filenamePattern),
        ),
      );
    }
  }
});

test("native writable providers are registered directly instead of wrapped as read-only", async () => {
  const f = await fixture();
  const provider = {
    openCustomDocument() {},
    resolveCustomEditor() {},
    saveCustomDocument() {},
    onDidChangeCustomDocument() {},
  };
  f.registerCustomEditor(
    f.context,
    { viewType: "onapi.request", provider },
    () => "p",
  );
  assert.equal(f.providers.get("onapi.request").provider, provider);
});

test("exported request files offer the request editor without claiming ordinary JSON files", async () => {
  const { readFile } = await import("node:fs/promises");
  const { matchesGlob } = await import("node:path");
  const manifest = JSON.parse(
    await readFile("apps/extension/package.json", "utf8"),
  );
  const editor = manifest.contributes.customEditors.find(
    (editor) => editor.viewType === "onapi.request",
  );
  assert.ok(
    editor.selector.some(({ filenamePattern }) =>
      matchesGlob("request.onapi.json", filenamePattern),
    ),
  );
  assert.ok(
    editor.selector.every(
      ({ filenamePattern }) => !matchesGlob("package.json", filenamePattern),
    ),
  );
});
