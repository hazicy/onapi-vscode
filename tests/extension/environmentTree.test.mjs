import { test } from "node:test";
import assert from "node:assert/strict";
import load from "../helpers/loadTypeScript.mjs";
import { readFile } from "node:fs/promises";

async function fixture() {
  const commands = new Map(),
    opened = [],
    imported = [],
    exported = [];
  let listener, provider, view;
  let exportFailure = false;
  let workspace = "one",
    error,
    failSave = false,
    writes = 0;
  const configs = {
    one: {
      http: {
        activeEnvironment: "dev",
        environments: [
          {
            id: "dev",
            name: "Development",
            values: [{ key: "url", value: "https://dev.test" }],
          },
          { id: "prod", name: "Production", values: [] },
        ],
        options: { keep: true },
      },
    },
    two: {
      http: {
        activeEnvironment: "qa",
        environments: [{ id: "qa", name: "QA", values: [] }],
      },
    },
  };
  const errors = [];
  const context = { subscriptions: [] };
  const { registerEnvironmentTree } = await load(
    "apps/extension/src/features/environment/environment-tree.ts",
    (id) => {
      if (id === "node:os") return { homedir: () => "/home/test" };
      if (id === "vscode")
        return {
          env: { language: "en" },
          EventEmitter: class {
            event = () => ({ dispose() {} });
            fire() {}
            dispose() {}
          },
          TreeItem: class {
            constructor(label) {
              this.label = label;
            }
          },
          ThemeIcon: class {
            constructor(id) {
              this.id = id;
            }
          },
          TreeItemCollapsibleState: { None: 0 },
          Uri: {
            file: (path) => ({ path }),
            joinPath: (uri, path) => ({ path: `${uri.path}/${path}` }),
          },
          window: {
            createTreeView: (id, options) => {
              assert.equal(id, "onapiEnvironments");
              provider = options.treeDataProvider;
              return (view = { dispose() {} });
            },
            showErrorMessage: (message) => errors.push(message),
            showQuickPick: async (items) => items[0],
            showSaveDialog: async () => ({ path: "/tmp/environment.json" }),
          },
          commands: {
            registerCommand: (id, run) => {
              commands.set(id, run);
              return { dispose() {} };
            },
          },
          workspace: {
            fs: {
              writeFile: async (uri, data) => {
                if (exportFailure) throw new Error("Permission denied");
                exported.push({ uri, data: JSON.parse(data.toString()) });
              },
            },
          },
        };
      if (id.endsWith("storage/project-config"))
        return {
          getCurrentProjectConfig: () => configs[workspace],
          getProjectWorkspace: () => workspace,
          getProjectConfig: (_, key) => configs[key],
          updateProjectConfig: async (_, key, change) => {
            if (failSave) return false;
            configs[key] = change(configs[key]);
            writes++;
            listener("projectConfig_-1_-1");
            return true;
          },
        };
      if (id.endsWith("storage/events"))
        return {
          storageChanged: {
            event: (run) => {
              listener = run;
              return { dispose() {} };
            },
          },
        };
      if (id.endsWith("platform/storage"))
        return { getStorageError: () => error };
      if (id === "./environment-panel")
        return { createEnvironmentPanel: (data) => opened.push(data) };
      if (id.endsWith("import-data-panel"))
        return { createImportDataPanel: (data) => imported.push(data) };
      throw new Error(`Unexpected dependency ${id}`);
    },
    { Buffer },
  );
  registerEnvironmentTree(context);
  return {
    commands,
    opened,
    imported,
    exported,
    errors,
    configs,
    provider,
    view,
    writes: () => writes,
    switchWorkspace: (key) => {
      workspace = key;
      listener("userConfig");
    },
    failExport: () => {
      exportFailure = true;
    },
    fail: () => {
      failSave = true;
    },
    storageError: () => {
      error = "Unavailable";
      listener("apiList");
    },
  };
}

test("environment tree opens an editor without changing the active environment", async () => {
  const f = await fixture();
  const [dev, prod] = f.provider.getChildren();
  assert.equal(f.view.description, "Development");
  assert.equal(f.provider.getTreeItem(dev).iconPath.id, "check");
  const item = f.provider.getTreeItem(prod);
  await f.commands.get(item.command.command)(prod);
  assert.equal(f.opened[0].id, "prod");
  assert.equal(f.configs.one.http.activeEnvironment, "dev");
  assert.equal(f.writes(), 0);
  await f.commands.get("onapi.environment.activate")(prod);
  assert.equal(f.configs.one.http.activeEnvironment, "prod");
  assert.equal(f.view.description, "Production");
  assert.equal(f.configs.one.http.options.keep, true);
});

test("environment list follows workspaces and ignores stale environment actions", async () => {
  const f = await fixture();
  const old = f.provider.getChildren()[0];
  f.switchWorkspace("two");
  assert.equal(f.provider.getChildren()[0].id, "qa");
  assert.equal(f.view.description, "QA");
  await f.commands.get("onapi.environment.activate")(old);
  assert.equal(f.writes(), 0);
  assert.equal(f.configs.two.http.activeEnvironment, "qa");
  f.storageError();
  assert.deepEqual(Array.from(f.provider.getChildren()), []);
  assert.match(f.view.message, /unavailable/);
});

test("failed activation retains the current environment", async () => {
  const f = await fixture();
  f.fail();
  await f.commands.get("onapi.environment.activate")(
    f.provider.getChildren()[1],
  );
  assert.equal(f.view.description, "Development");
  assert.equal(f.errors.length, 1);
});

test("create, import and export reuse environment data without changing selection", async () => {
  const f = await fixture();
  await f.commands.get("onapi.environment.create")();
  assert.equal(f.opened[0].create, true);
  await f.commands.get("onapi.environment.import")();
  assert.equal(f.imported[0].type, "postman");
  await f.commands.get("onapi.environment.export")(f.provider.getChildren()[0]);
  assert.equal(f.exported[0].data._postman_variable_scope, "environment");
  assert.equal(f.exported[0].data.values[0].value, "https://dev.test");
  assert.equal(f.writes(), 0);
});

test("environment view manifest separates edit from activation", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../../apps/extension/package.json", import.meta.url),
      "utf8",
    ),
  );
  assert.ok(
    manifest.contributes.views.onapi.some(
      (view) => view.id === "onapiEnvironments",
    ),
  );
  const activate = manifest.contributes.menus["view/item/context"].find(
    (item) => item.command === "onapi.environment.activate",
  );
  assert.match(activate.when, /viewItem == onapiEnvironment$/);
});

test("export failures give a useful error instead of rejecting the command", async () => {
  const f = await fixture();
  f.failExport();
  await f.commands.get("onapi.environment.export")(f.provider.getChildren()[0]);
  assert.equal(f.errors.length, 1);
  assert.match(f.errors[0], /Failed to export environment/);
  assert.equal(f.exported.length, 0);
});
