import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import path from "node:path";
import dependency4 from "../../apps/extension/package.json" with { type: "json" };
import { fileURLToPath } from "node:url";
const __dirname = fileURLToPath(new URL(".", import.meta.url));
test("native sidebar panels, test commands and workspace request history", async () => {
  const views = new Map();
  const viewOptions = new Map();
  const commands = new Map();
  const writes = new Map();
  const executed = [];
  let decorations;
  const rows = [
    {
      id: "folder",
      kind: "folder",
      parentId: "0",
      name: "Samples",
    },
    {
      id: "nested",
      kind: "folder",
      parentId: "folder",
      name: "Nested",
    },
    {
      id: "request",
      kind: "api",
      parentId: "nested",
      name: "Get user",
      request: { method: "GET", url: "/users" },
    },
  ];
  const report = {
    report_id: "report",
    report_name: "Samples run",
    startedAt: Date.now(),
    events: [{ type: "done", error: null }],
  };
  let nextId = 0;
  let storageError;
  class EventEmitter {
    listeners = [];
    event = (listener) => {
      this.listeners.push(listener);
      return { dispose() {} };
    };
    fire = (value) => this.listeners.forEach((listener) => listener(value));
    dispose() {}
  }
  const context = {
    subscriptions: [],
    project: "one",
    extensionUri: "/extension",
  };
  const mocks = {
    vscode: {
      EventEmitter,
      DataTransferItem: class {
        constructor(value) {
          this.value = value;
        }
      },
      MarkdownString: class {
        value = "";
        appendText(value) {
          this.value += value.replace(/[\\`*_{}[\]()<>#+.!-]/g, "\\$&");
          return this;
        }
        appendMarkdown(value) {
          this.value += value;
          return this;
        }
      },
      Uri: { from: (parts) => parts, joinPath: (...parts) => parts.join("/") },
      TreeItem: class {
        constructor(label, collapsibleState) {
          Object.assign(this, { label, collapsibleState });
        }
      },
      ThemeIcon: class {
        constructor(id, color) {
          Object.assign(this, { id, color });
        }
      },
      ThemeColor: class {
        constructor(id) {
          this.id = id;
        }
      },
      QuickPickItemKind: { Separator: -1 },
      TreeItemCollapsibleState: { None: 0, Collapsed: 1, Expanded: 2 },
      env: { language: "zh-cn" },
      window: {
        registerFileDecorationProvider: (provider) => {
          decorations = provider;
          return { dispose() {} };
        },
        createTreeView: (id, options) => {
          views.set(id, options.treeDataProvider);
          viewOptions.set(id, options);
          return { dispose() {} };
        },
        showInputBox: async () => "Get user",
        showQuickPick: async (items) => items[0],
      },
      commands: {
        registerCommand: (id, fn) => {
          commands.set(id, fn);
          return { dispose() {} };
        },
        executeCommand: (...args) => executed.push(args),
      },
    },
    utils: {
      getApiList: () => rows,
      getCurrentProjectConfig: () => ({}),
      getProjectReportList: () => [report],
      getApiListName: (ctx) => `apiList:${ctx.project}`,
    },
    db: {
      getStorageError: () => storageError,
      getDataFromGlobalStorage: (_, key, fallback) =>
        writes.get(key) ?? fallback,
      setDataToGlobalStorage: async (_, key, value) => {
        writes.set(key, value);
        return true;
      },
      updateDataInGlobalStorage: async (_, key, change) => {
        writes.set(key, change(writes.get(key) || []));
        return true;
      },
    },
    sidbar: { handleMessage: () => true },
    apis: { copyAsCurl: (...args) => executed.push(["copyAsCurl", ...args]) },
    common: {
      APIS_BASE_DEFAULT_DATA: { api: { response: { restored: true } } },
    },
    constants: {
      APIS_TARGET_TYPE_ENUM: {
        API: "api",
        FOLDER: "folder",
        GRAPHQL: "graphql",
        WEBSOCKET: "websocket",
        SOCKETIO: "socketio",
        AI: "ai",
        MCP: "mcp",
      },
    },
    dataTools: { snowflakeId: () => String(++nextId) },
    "share-data": {
      getDocBaseUrl: () => "http://127.0.0.1:3000/api-docs",
      getProjectShareData: () => Object.fromEntries(writes),
      createShare: async (data) => {
        writes.set(data.id, data);
        return true;
      },
    },
    config: { globalConfig: {} },
  };
  mocks.vscode.env.clipboard = {
    writeText: async (url) => executed.push(["clipboard", url]),
  };
  mocks.vscode.env.openExternal = async (uri) =>
    executed.push(["openExternal", uri]);
  mocks.vscode.Uri.parse = (uri) => uri;
  mocks.vscode.window.showInformationMessage = async (_, action) => action;
  mocks.vscode.window.showErrorMessage = async (message) =>
    executed.push(["error", message]);
  globalThis.__onapiNativeMocks = mocks;
  try {
    const result = await build({
      stdin: {
        contents:
          "export { registerSidebarTree } from './apps/extension/src/features/sidebar/register'; export { recordRequestHistory, getRequestHistory } from './apps/extension/src/features/requests/request-history'; export { storageChanged } from './apps/extension/src/platform/storage/events'; export { requestChildren } from './apps/extension/src/features/sidebar/tree-data'; export { setRequestResult } from './apps/extension/src/features/requests/request-status';",
        resolveDir: path.resolve(__dirname, "../.."),
      },
      bundle: true,
      write: false,
      platform: "node",
      format: "esm",
      plugins: [
        {
          name: "native-test-dependencies",
          setup(builder) {
            builder.onResolve(
              {
                filter:
                  /^vscode$|(^|\/)(project-config|request-storage|report-storage|collection-order|import-curl|prepare-options|html|host-utils|user-config|storage|sidebar-handler|commands|data-tools|share-data|config)$|^@onapi\/domain\/requests\/constants\/(common|index)$/,
              },
              (args) => {
                const key =
                  args.path === "@onapi/domain/requests/constants/index"
                    ? "constants"
                    : ({
                        "project-config": "utils",
                        "request-storage": "utils",
                        "report-storage": "utils",
                        "collection-order": "utils",
                        "import-curl": "utils",
                        "prepare-options": "utils",
                        html: "utils",
                        "host-utils": "utils",
                        "user-config": "utils",
                        storage: "db",
                        "sidebar-handler": "sidbar",
                        commands: "apis",
                        "data-tools": "dataTools",
                      }[args.path.split("/").pop()] ??
                      args.path.split("/").pop());
                if (mocks[key]) {
                  return { path: key, namespace: "mock" };
                }
              },
            );
            builder.onLoad({ filter: /.*/, namespace: "mock" }, (args) => ({
              contents: Object.entries(mocks[args.path])
                .map(([key, value]) => {
                  const reference = `globalThis.__onapiNativeMocks[${JSON.stringify(args.path)}][${JSON.stringify(key)}]`;
                  const expression =
                    typeof value === "function" &&
                    !/^class\s/.test(String(value))
                      ? `(...args) => ${reference}(...args)`
                      : reference;
                  return `export const ${key} = ${expression};`;
                })
                .join("\n"),
              loader: "js",
            }));
          },
        },
      ],
    });
    const bundled = await import(
      "data:text/javascript;base64," +
        Buffer.from(result.outputFiles[0].text).toString("base64")
    );
    const {
      registerSidebarTree,
      recordRequestHistory,
      getRequestHistory,
      storageChanged,
      requestChildren,
      setRequestResult,
    } = bundled;
    registerSidebarTree(context);
    storageError = "Unsupported storage version: 1";
    for (const id of ["onapiRequests", "onapiTests", "onapiHistory"]) {
      const provider = views.get(id);
      assert.ok(provider);
      const [node] = provider.getChildren();
      assert.equal(node.id, "storage:error");
      assert.match(node.label, /Unsupported storage version/);
      assert.equal(
        provider.getTreeItem(node).command.command,
        "onapi.storage.recover",
      );
    }
    storageError = undefined;
    assert.deepEqual(
      [...views.keys()],
      ["onapiRequests", "onapiTests", "onapiHistory"],
    );
    const beforeCreate = executed.length;
    mocks.sidbar.handleMessage = () => false;
    await commands.get("onapi.tree.new")();
    assert.equal(executed.length, beforeCreate);
    mocks.sidbar.handleMessage = () => true;
    await commands.get("onapi.tree.new")();
    assert.equal(executed.at(-1)[0], "openTabPanel");
    const originalPicker = mocks.vscode.window.showQuickPick;
    mocks.common.APIS_BASE_DEFAULT_DATA.websocket = {
      message: [{ request: { raw: "" } }],
    };
    mocks.vscode.window.showQuickPick = async (items) => {
      assert.equal(items.filter((item) => item.type === "websocket").length, 1);
      return items.find((item) => item.type === "websocket");
    };
    await commands.get("onapi.tree.new")();
    assert.equal(executed.at(-1)[1].kind, "websocket");
    assert.equal(executed.at(-1)[1].message.length, 1);
    for (const kind of ["ai", "mcp"]) {
      mocks.common.APIS_BASE_DEFAULT_DATA[kind] = { [kind]: { model: "test" } };
      mocks.vscode.window.showQuickPick = async (items) =>
        items.find((item) => item.type === kind);
      await commands.get("onapi.tree.new")();
      assert.equal(executed.at(-1)[1].kind, kind);
      assert.equal(executed.at(-1)[1][kind].model, "test");
    }
    mocks.vscode.window.showQuickPick = originalPicker;
    const requests = views.get("onapiRequests");
    const folderDescription = (data) =>
      requests.getTreeItem({ kind: "request", data }).description;
    assert.equal(folderDescription(rows[0]), "(1)");
    assert.equal(folderDescription(rows[1]), "(1)");
    const extraRows = [
      {
        id: "empty",
        parentId: "folder",
        kind: "folder",
      },
      {
        id: "socket",
        parentId: "folder",
        kind: "socket",
      },
      {
        id: "method",
        parentId: "socket",
        kind: "socket_method",
      },
      {
        id: "samples",
        parentId: "folder",
        kind: "sample_group",
      },
    ];
    rows.push(...extraRows);
    assert.equal(folderDescription(rows[0]), "(2)");
    assert.equal(folderDescription(extraRows[0]), undefined);
    rows.splice(3);
    for (const method of [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "HEAD",
      "OPTIONS",
    ]) {
      const item = requests.getTreeItem({
        kind: "request",
        data: { ...rows[2], request: { ...rows[2].request, method } },
      });
      assert.equal(item.iconPath.id, `onapi-http-${method.toLowerCase()}`);
      assert.equal(item.description, "/users");
      assert.equal(item.tooltip.value, `${method} /users`);
      assert.equal(item.tooltip.isTrusted, undefined);
    }
    assert.ok(
      requests.getTreeItem({ kind: "request", data: rows[0] }).iconPath.id ===
        "onapi-folder",
    );
    assert.equal(
      requests.getTreeItem({ kind: "request", data: rows[0] }).iconPath.color,
      undefined,
    );
    assert.ok(
      requests.getTreeItem({
        kind: "request",
        data: { ...rows[2], kind: "graphql" },
      }).iconPath.id === "onapi-graphql",
    );
    assert.ok(
      requests.getTreeItem({
        kind: "request",
        data: { ...rows[2], request: { ...rows[2].request, method: "CUSTOM" } },
      }).iconPath.id === "onapi-http",
    );
    for (const [protocol, icon] of Object.entries({
      graphql: "type-hierarchy",
      websocket: "debug-disconnect",
      socketio: "plug",
      grpc: "server-process",
      doc: "file-text",
    })) {
      const item = requests.getTreeItem({
        kind: "request",
        data: { ...rows[2], kind: protocol },
      });
      assert.equal(item.iconPath.id, `onapi-${protocol.replaceAll("_", "-")}`);
    }
    const resource = requests.getTreeItem({
      kind: "request",
      data: rows[2],
    }).resourceUri;
    assert.equal(resource.scheme, "onapi-request");
    assert.equal(decorations.provideFileDecoration(resource), undefined);
    assert.equal(
      decorations.provideFileDecoration({ ...resource, scheme: "file" }),
      undefined,
    );
    rows[2].request.url = "";
    assert.equal(
      requests.getTreeItem({ kind: "request", data: rows[2] }).iconPath.color
        .id,
      "onapi.method.get",
    );
    assert.equal(decorations.provideFileDecoration(resource).badge, undefined);
    assert.equal(decorations.provideFileDecoration(resource).color, undefined);
    assert.match(
      requests.getTreeItem({ kind: "request", data: rows[2] }).tooltip.value,
      /缺少 URL/,
    );
    rows[2].request.url = "/users";
    const decorationChanges = [];
    const refreshedRequests = [];
    requests.onDidChangeTreeData((node) =>
      refreshedRequests.push(node?.data.id),
    );
    decorations.onDidChangeFileDecorations((uri) =>
      decorationChanges.push(uri),
    );
    setRequestResult("apiList:one", "request", { code: 200 });
    assert.deepEqual(decorationChanges, [resource]);
    assert.deepEqual(refreshedRequests, ["request"]);
    assert.equal(decorations.provideFileDecoration(resource).badge, undefined);
    assert.equal(decorations.provideFileDecoration(resource).color, undefined);
    assert.match(
      requests.getTreeItem({ kind: "request", data: rows[2] }).tooltip.value,
      /上次运行/,
    );
    setRequestResult("apiList:two", "request", { code: 500 });
    assert.equal(decorationChanges.length, 1);
    assert.deepEqual(refreshedRequests, ["request"]);
    context.project = "two";
    assert.equal(decorations.provideFileDecoration(resource), undefined);
    context.project = "one";
    const folderNode = { kind: "request", data: rows[0] };
    const requestNode = { kind: "request", data: rows[2] };
    const messages = [];
    mocks.sidbar.handleMessage = (message) => {
      messages.push(message);
      return true;
    };
    const drag = viewOptions.get("onapiRequests").dragAndDropController;
    assert.equal(viewOptions.get("onapiRequests").canSelectMany, true);
    const transfer = new Map();
    const token = { isCancellationRequested: false };
    drag.handleDrag([requestNode], transfer);
    await drag.handleDrop(folderNode, transfer, token);
    assert.deepEqual(messages.at(-1), {
      action: "onDrop",
      data: {
        ids: ["request"],
        parentId: "folder",
        after_id: "0",
        before_id: "0",
      },
    });
    await drag.handleDrop(undefined, transfer, token);
    assert.equal(messages.at(-1).data.parentId, "0");
    drag.handleDrag([folderNode], transfer);
    const beforeInvalidDrop = messages.length;
    await drag.handleDrop({ kind: "request", data: rows[1] }, transfer, token);
    await drag.handleDrop(folderNode, transfer, token);
    assert.equal(messages.length, beforeInvalidDrop);
    drag.handleDrag([{ kind: "request", data: rows[1] }], transfer);
    await drag.handleDrop(requestNode, transfer, token);
    assert.equal(messages.length, beforeInvalidDrop);
    drag.handleDrag([requestNode], transfer);
    context.project = "two";
    await drag.handleDrop(undefined, transfer, token);
    context.project = "one";
    await drag.handleDrop(undefined, transfer, {
      isCancellationRequested: true,
    });
    assert.equal(messages.length, beforeInvalidDrop);
    drag.handleDrag([folderNode, requestNode], transfer);
    await drag.handleDrop(undefined, transfer, token);
    assert.deepEqual(messages.at(-1).data.ids, ["folder"]);
    const sibling = { ...rows[2], id: "sibling", parentId: "0" };
    rows.push(sibling);
    drag.handleDrag([requestNode], transfer);
    await drag.handleDrop({ kind: "request", data: sibling }, transfer, token);
    assert.deepEqual(messages.at(-1).data, {
      ids: ["request"],
      parentId: "0",
      after_id: "0",
      before_id: "sibling",
    });
    rows.pop();
    const originalInput = mocks.vscode.window.showInputBox;
    mocks.vscode.window.showInputBox = async () => " Renamed ";
    await commands.get("onapi.tree.rename")(requestNode);
    assert.equal(messages.at(-1).action, "saveFolder");
    assert.equal(messages.at(-1).data.name, "Renamed");
    assert.equal(rows[2].name, "Get user");
    const messageCount = messages.length;
    mocks.vscode.window.showInputBox = async () => undefined;
    await commands.get("onapi.tree.rename")(folderNode);
    assert.equal(messages.length, messageCount);
    mocks.vscode.window.showInputBox = async () => {
      context.project = "two";
      return "Wrong workspace";
    };
    await commands.get("onapi.tree.rename")(folderNode);
    assert.equal(messages.length, messageCount);
    context.project = "one";
    mocks.vscode.window.showInputBox = originalInput;
    await commands.get("onapi.tree.clone")(requestNode);
    assert.deepEqual(messages.at(-1), {
      action: "cloneApi",
      data: { id: "request" },
    });
    await commands.get("onapi.tree.delete")(folderNode);
    assert.equal(messages.at(-1).action, "showConfirmation");
    assert.equal(messages.at(-1).data.id, "folder");
    await commands.get("onapi.tree.folderSettings")(folderNode);
    assert.deepEqual(messages.at(-1), {
      action: "openTagPanelById",
      data: "folder",
    });
    await commands.get("onapi.tree.revealStorage")(requestNode);
    assert.equal(messages.at(-1).action, "openVscodeFileExplorer");
    await commands.get("onapi.tree.folderReports")(folderNode);
    assert.deepEqual(executed.at(-1), [
      "onapi.folderTest",
      rows[0],
      { openHistoryReport: true },
    ]);
    await commands.get("onapi.tree.copyCurl")(requestNode);
    assert.equal(executed.at(-1)[0], "copyAsCurl");
    assert.equal(executed.at(-1)[1].parentId, "0");
    assert.equal(rows[2].parentId, "nested");
    await commands.get("onapi.tree.new")(folderNode, "folder");
    assert.equal(messages.at(-1).data.parentId, "folder");
    assert.equal(messages.at(-1).data.kind, "folder");
    const manifest = dependency4;
    for (const item of manifest.contributes.menus["view/item/context"].filter(
      (item) => item.command.startsWith("onapi.tree."),
    )) {
      assert.ok(commands.has(item.command), `missing handler: ${item.command}`);
    }
    mocks.sidbar.handleMessage = () => true;
    await commands.get("onapi.tree.shareDocs")({
      kind: "request",
      data: rows[2],
    });
    assert.equal(writes.get("request").id, "request");
    assert.deepEqual(executed.at(-2), [
      "clipboard",
      "http://127.0.0.1:3000/api-docs?share_id=request",
    ]);
    assert.deepEqual(executed.at(-1), [
      "openExternal",
      "http://127.0.0.1:3000/api-docs?share_id=request",
    ]);
    const beforeShare = executed.length;
    await commands.get("onapi.tree.shareDocs")({
      kind: "request",
      data: rows[0],
    });
    assert.ok(executed.length > beforeShare);
    assert.equal(writes.get("folder").id, "folder");
    mocks["share-data"].createShare = async () => false;
    await commands.get("onapi.tree.shareDocs")({
      kind: "request",
      data: rows[2],
    });
    assert.equal(executed.at(-1)[0], "error");
    const tests = views.get("onapiTests");
    const history = views.get("onapiHistory");
    let refreshes = 0;
    requests.onDidChangeTreeData(() => refreshes++);
    storageChanged.fire("unrelated");
    assert.equal(refreshes, 0);
    storageChanged.fire("apiList:one");
    storageChanged.fire("one:test");
    storageChanged.fire("userConfig");
    assert.equal(refreshes, 3);
    const orphan = {
      ...rows[2],
      id: "orphan",
      parentId: "missing",
      sort: 2,
    };
    assert.equal(requestChildren([...rows, orphan]).at(-1).id, "orphan");
    const cycle = [{ ...rows[0], parentId: "nested" }, rows[1], rows[2]];
    assert.deepEqual(requestChildren(cycle, undefined, "get user"), []);
    assert.equal(requests.getChildren()[0].kind, "request");
    assert.equal(
      requests.getChildren(requests.getChildren()[0])[0].data.id,
      "nested",
    );
    const testFolder = tests.getChildren()[0];
    assert.equal(testFolder.kind, "testFolder");
    assert.equal(tests.getTreeItem(testFolder).description, "(1)");
    assert.ok(tests.getTreeItem(testFolder).iconPath.id === "onapi-tests");
    await commands.get("onapi.tree.runTests")(testFolder);
    assert.equal(executed.at(-1)[0], "onapi.folderTest");
    const reports = tests.getChildren().find((node) => node.kind === "reports");
    assert.ok(tests.getTreeItem(reports).iconPath.id === "onapi-reports");
    await commands.get("onapi.tree.openReport")(tests.getChildren(reports)[0]);
    assert.deepEqual(executed.at(-1), ["onapi.folderTestReportData", report]);
    assert.equal(history.getChildren()[0].kind, "empty");
    const sent = { ...rows[2], response: { raw: "large body" } };
    await recordRequestHistory(context, sent);
    sent.request.url = "/changed";
    assert.equal(getRequestHistory(context)[0].request.request.url, "/users");
    assert.equal(getRequestHistory(context)[0].request.response, undefined);
    const day = history.getChildren()[0];
    assert.equal(day.kind, "day");
    assert.ok(history.getTreeItem(day).iconPath.id === "onapi-history");
    const entry = history.getChildren(day)[0];
    await commands.get("onapi.tree.openHistory")(entry);
    assert.equal(executed.at(-1)[0], "openTabPanel");
    assert.notEqual(executed.at(-1)[1].id, "request");
    assert.deepEqual(executed.at(-1)[1].response, { restored: true });
    context.project = "two";
    assert.deepEqual(getRequestHistory(context), []);
    context.project = "one";
    for (let i = 0; i < 205; i++) {
      await recordRequestHistory(context, sent);
    }
    assert.equal(getRequestHistory(context).length, 200);
    await commands.get("onapi.tree.filter")();
    assert.equal(requests.getChildren()[0].data.id, "folder");
    assert.equal(
      requests.getChildren(requests.getChildren()[0])[0].data.id,
      "nested",
    );
  } finally {
    delete globalThis.__onapiNativeMocks;
  }
});
