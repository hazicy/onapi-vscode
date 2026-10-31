import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import loadTypeScript, {
  nativeDependency,
} from "../helpers/loadTypeScript.mjs";

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "json-repository-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  class Uri {
    constructor(p) {
      this.path = p;
      this.fsPath = p;
    }
    static joinPath(uri, ...parts) {
      return new Uri(path.join(uri.path, ...parts));
    }
    with({ path: p }) {
      return new Uri(p);
    }
    toString() {
      return this.path;
    }
  }
  const translate = async (work) => {
    try {
      return await work();
    } catch (e) {
      if (e.code === "ENOENT") e.code = "FileNotFound";
      throw e;
    }
  };
  const handlers = {};
  const noop = () => ({ dispose() {} });
  const errors = [];
  const host = {
    Uri,
    FileType: { File: 1, Directory: 2 },
    RelativePattern: class {},
    window: { showErrorMessage: (m) => errors.push(m) },
    workspace: {
      workspaceFolders: [{ uri: new Uri(path.join(root, "workspace")) }],
      createFileSystemWatcher: () => ({
        dispose() {},
        ...Object.fromEntries(
          ["Create", "Change", "Delete"].map((type) => [
            `onDid${type}`,
            (fn) => {
              handlers[type] = fn;
              return noop();
            },
          ]),
        ),
      }),
      fs: {
        readFile: (u) => translate(() => fs.readFile(u.path)),
        writeFile: (u, b) => fs.writeFile(u.path, b),
        createDirectory: (u) => fs.mkdir(u.path, { recursive: true }),
        rename: (a, b) => fs.rename(a.path, b.path),
        delete: (u) => translate(() => fs.unlink(u.path)),
        readDirectory: (u) =>
          translate(async () =>
            (await fs.readdir(u.path, { withFileTypes: true })).map((d) => [
              d.name,
              d.isDirectory() ? 2 : 1,
            ]),
          ),
      },
    },
  };
  const secrets = new Map(),
    states = new Map(),
    workspaceStates = new Map();
  const context = {
    globalStorageUri: new Uri(path.join(root, "global")),
    subscriptions: [],
    globalState: {
      get: (k, d) => states.get(k) ?? d,
      update: async (k, v) => states.set(k, v),
    },
    workspaceState: {
      get: (k, d) => workspaceStates.get(k) ?? d,
      update: async (k, v) => workspaceStates.set(k, v),
    },
    secrets: {
      get: async (k) => secrets.get(k),
      store: async (k, v) => secrets.set(k, v),
    },
  };
  let changes = 0;
  const { JsonRepository } = await loadTypeScript(
    "apps/extension/src/platform/storage/repository.ts",
    (id) => {
      if (id === "vscode") return host;
      if (id === "./events") return { storageChanged: { fire() {} } };
      if (id === "./index")
        return {
          repositories: new WeakMap(),
        };
      return nativeDependency(id);
    },
    { Buffer, setTimeout, clearTimeout },
  );
  const repo = new JsonRepository(context, () => changes++);
  await repo.start();
  t.after(() => context.subscriptions.forEach((s) => s.dispose()));
  return {
    host,
    repo,
    context,
    JsonRepository,
    root: path.join(root, "global", ".api-client"),
    errors,
    handlers,
    changes: () => changes,
  };
}
const config = () => ({
  http: {
    collection: { info: { name: "Requests" } },
    environments: [
      {
        id: "dev",
        name: "Dev",
        values: [{ key: "api_key", value: "PRIVATE_KEY" }],
      },
    ],
    activeEnvironment: "dev",
  },
});

const records = () => [
  { id: "users", parentId: "0", kind: "folder", name: "Users", sort: 0 },
  {
    id: "get-user",
    sort: 1,
    parentId: "users",
    kind: "api",
    name: "Get",
    request: {
      method: "GET",
      url: "https://example.com",
      auth: {
        type: "bearer",
        bearer: [{ key: "token", value: "PRIVATE_TOKEN" }],
      },
    },
  },
];
test("separate files, secrets, restart recovery and deletion", async (t) => {
  const f = await fixture(t);
  const key = "projectConfig_-1_-1";
  await f.repo.set(key, config());
  await f.repo.set("apiList", records());
  await f.repo.flush();
  assert.deepEqual(f.errors, []);
  const requestFile = path.join(f.root, "collections/users/get-user.json");
  const raw = await fs.readFile(requestFile, "utf8");
  assert.ok(!raw.includes("PRIVATE_TOKEN"));
  assert.ok(
    !(
      await fs.readFile(path.join(f.root, "environments/dev.json"), "utf8")
    ).includes("PRIVATE_KEY"),
  );
  const second = new f.JsonRepository(f.context, () => {});
  await second.reload();
  assert.equal(
    second.get("apiList", [])[1].request.auth.bearer[0].value,
    "PRIVATE_TOKEN",
  );
  assert.equal(second.get(key, {}).http.activeEnvironment, "dev");
  assert.deepEqual(
    JSON.parse(JSON.stringify(second.get("apiList", []))),
    records(),
  );
  await f.repo.set("apiList", records().slice(0, 1));
  await f.repo.flush();
  await assert.rejects(fs.stat(requestFile));
});

test("external changes reload and invalid JSON preserves the last snapshot", async (t) => {
  const f = await fixture(t),
    key = "projectConfig_-1_-1";
  await f.repo.set(key, config());
  await f.repo.set("apiList", records());
  await f.repo.flush();
  const file = path.join(f.root, "collections/users/get-user.json");
  const data = JSON.parse(await fs.readFile(file, "utf8"));
  data.name = "Changed in Git";
  await fs.writeFile(file, JSON.stringify(data));
  f.handlers.Change();
  await new Promise((r) => setTimeout(r, 300));
  await f.repo.flush();
  assert.ok(f.changes() >= 1);
  assert.equal(f.repo.get("apiList", [])[1].name, "Changed in Git");
  await fs.writeFile(file, "{broken");
  await assert.rejects(f.repo.reload());
  assert.equal(f.repo.get("apiList", [])[1].name, "Changed in Git");
});

test("JSONL history survives restart without leaking credentials", async (t) => {
  const f = await fixture(t),
    key = "apiList:history";
  await f.repo.set(key, [
    {
      id: "1",
      sentAt: 1,
      request: { id: "request", kind: "api", auth: { token: "PRIVATE" } },
    },
  ]);
  await f.repo.flush();
  const second = new f.JsonRepository(f.context, () => {});
  await second.loadHistory(key);
  assert.equal(second.get(key, [])[0].request.auth.token, "PRIVATE");
  const dir = path.join(f.context.globalStorageUri.path, "history");
  const files = await fs.readdir(dir);
  assert.match(files[0], /\.jsonl$/);
  assert.ok(
    !(await fs.readFile(path.join(dir, files[0]), "utf8")).includes("PRIVATE"),
  );
});

test("invalid IDs are rejected before changing the snapshot", async (t) => {
  const f = await fixture(t),
    key = "projectConfig_-1_-1";
  await f.repo.set(key, config());
  await f.repo.set("apiList", records());
  await f.repo.flush();
  const invalid = records();
  invalid[1].id = "users";
  await assert.rejects(() => f.repo.set("apiList", invalid), /duplicate/);
  assert.equal(f.repo.get("apiList", [])[1].id, "get-user");
});

test("interrupted writes preserve the previous file, clean temporary files and roll back the snapshot", async (t) => {
  const f = await fixture(t),
    key = "projectConfig_-1_-1";
  await f.repo.set(key, config());
  await f.repo.set("apiList", records());
  await f.repo.flush();
  const file = path.join(f.root, "collections/users/collection.json");
  const before = await fs.readFile(file, "utf8");
  f.host.workspace.fs.rename = async () => {
    throw new Error("disk unavailable");
  };
  const changed = records();
  changed[0].name = "Not committed";
  await assert.rejects(f.repo.set("apiList", changed), /disk unavailable/);
  await f.repo.flush();
  assert.equal(await fs.readFile(file, "utf8"), before);
  assert.equal(f.repo.get("apiList", [])[0].name, "Users");
  assert.deepEqual(f.errors, []);
  assert.ok(
    (await fs.readdir(path.dirname(file))).every(
      (name) => !name.endsWith(".tmp"),
    ),
  );
});

test("request order, protocol environments and protocol requests survive restart", async (t) => {
  const f = await fixture(t),
    key = "projectConfig_-1_-1";
  const data = config();
  const items = records();
  items.push({
    parentId: "0",
    kind: "api",
    id: "aaa",
    sort: 2,
    name: "Last",
    request: { method: "GET", url: "https://example.com" },
  });
  data.envList = [
    {
      env_id: "socket-env",
      name: "Socket environment",
      sort: 1,
      env_var_list: { token: "PRIVATE" },
    },
  ];
  await f.repo.set(key, data);
  items.push({
    id: "ws-1",
    sort: 3,
    parentId: "users",
    kind: "websocket",
    name: "Socket",
  });
  await f.repo.set("apiList", items);
  await f.repo.flush();
  const second = new f.JsonRepository(f.context, () => {});
  await second.reload();
  assert.equal(second.get("apiList", [])[0].id, "users");
  assert.equal(second.get(key, {}).envList[0].env_var_list.token, "PRIVATE");
  assert.equal(second.get("apiList", [])[3].id, "ws-1");
  assert.ok(
    !(
      await fs.readFile(
        path.join(f.root, "environments/protocols/socket-env.json"),
        "utf8",
      )
    ).includes("PRIVATE"),
  );
});

test("global data and environment selection are shared across folders and empty windows", async (t) => {
  const f = await fixture(t),
    key = "projectConfig_-1_-1";
  await f.repo.set(key, config());
  await f.repo.set("apiList", records());
  await f.repo.flush();
  const originalFolder = f.host.workspace.workspaceFolders[0].uri;
  await assert.rejects(fs.stat(path.join(originalFolder.path, ".api-client")));
  for (const folders of [
    [{ uri: f.host.Uri.joinPath(originalFolder, "other") }],
    undefined,
  ]) {
    f.host.workspace.workspaceFolders = folders;
    const context = {
      ...f.context,
      workspaceState: { get: (_, d) => d, update: async () => {} },
    };
    const second = new f.JsonRepository(context, () => {});
    await second.start();
    assert.equal(second.root.path, f.root);
    assert.equal(second.get(key, {}).http.activeEnvironment, "dev");
    assert.equal(second.get("apiList", [])[0].id, "users");
  }
});

test("startup ignores project-local files, old global files and workspace environment state", async (t) => {
  const f = await fixture(t);
  const oldFolder = f.host.Uri.joinPath(
    f.host.workspace.workspaceFolders[0].uri,
    ".api-client",
  );
  await fs.mkdir(oldFolder.path, { recursive: true });
  await fs.writeFile(
    path.join(oldFolder.path, "config.json"),
    "{old unsupported format",
  );
  const oldGlobalFile = path.join(
    f.context.globalStorageUri.path,
    "projectConfig_-1_-1.json",
  );
  await fs.mkdir(f.context.globalStorageUri.path, { recursive: true });
  await fs.writeFile(oldGlobalFile, JSON.stringify(config()));
  await f.context.globalState.update("projectConfig", { "-1": config() });
  await f.context.workspaceState.update(
    "api-client:projectConfig_-1_-1:environment",
    "old-workspace-env",
  );
  const second = new f.JsonRepository(f.context, () => {});
  await second.start();
  assert.equal(second.has("projectConfig_-1_-1"), false);
  assert.deepEqual(f.errors, []);
  await assert.rejects(fs.stat(path.join(f.root, "config.json")));
  assert.equal(
    await fs.readFile(path.join(oldFolder.path, "config.json"), "utf8"),
    "{old unsupported format",
  );
  assert.ok(await fs.stat(oldGlobalFile));
});

test("unified records support moves, physical deletion and environment saves without a second request copy", async (t) => {
  const f = await fixture(t);
  await f.repo.set("projectConfig_-1_-1", config());
  await f.repo.set("apiList", records());
  await f.repo.flush();
  const moved = records();
  moved[1].parentId = "0";
  await f.repo.set("apiList", moved);
  await f.repo.flush();
  await assert.rejects(
    fs.stat(path.join(f.root, "collections/users/get-user.json")),
  );
  assert.ok(await fs.stat(path.join(f.root, "collections/get-user.json")));
  const changed = config();
  changed.http.environments[0].name = "Renamed";
  await f.repo.set("projectConfig_-1_-1", changed);
  await f.repo.flush();
  assert.ok(await fs.stat(path.join(f.root, "collections/get-user.json")));
  const second = new f.JsonRepository(f.context, () => {});
  await second.reload();
  assert.deepEqual(
    JSON.parse(JSON.stringify(second.get("apiList", []))),
    moved,
  );
  await f.repo.set("apiList", []);
  await f.repo.flush();
  await second.reload();
  assert.equal(second.get("apiList", []).length, 0);
  await assert.rejects(fs.stat(path.join(f.root, "collections/get-user.json")));
  const stored = JSON.parse(
    await fs.readFile(path.join(f.root, "config.json"), "utf8"),
  );
  assert.equal(stored.version, 2);
  assert.equal(stored.data.http.collection.item, undefined);
  assert.equal(stored.data.http.itemMetadata, undefined);
});

test("request validation rejects old fields, duplicate definitions, broken ancestry and cycles", async (t) => {
  const f = await fixture(t);
  for (const patch of [
    { target_id: "old" },
    { parent_id: "0" },
    { target_type: "api" },
    { is_deleted: -1 },
    { item: [] },
  ]) {
    await assert.rejects(
      () => f.repo.set("apiList", [{ ...records()[0], ...patch }]),
      /Unsupported/,
    );
  }
  await assert.rejects(
    () =>
      f.repo.set("apiList", [
        { id: "orphan", parentId: "missing", kind: "folder" },
      ]),
    /parent/,
  );
  await assert.rejects(
    () =>
      f.repo.set("apiList", [
        { id: "a", parentId: "b", kind: "folder" },
        { id: "b", parentId: "a", kind: "folder" },
      ]),
    /Circular/,
  );
  const data = config();
  data.http.collection.item = [];
  await assert.rejects(
    () => f.repo.set("projectConfig_-1_-1", data),
    /must not contain request records/,
  );
});

test("a request ID named collection cannot overwrite its parent collection definition", async (t) => {
  const f = await fixture(t);
  const items = records();
  items[1].id = "collection";
  await f.repo.set("apiList", items);
  await f.repo.flush();
  const second = new f.JsonRepository(f.context, () => {});
  await second.reload();
  assert.deepEqual(
    JSON.parse(JSON.stringify(second.get("apiList", []))),
    items,
  );
});

test("save resolves and publishes its snapshot only after the file commit", async (t) => {
  const f = await fixture(t);
  await f.repo.set("apiList", records());
  const rename = f.host.workspace.fs.rename;
  let release, started;
  const entered = new Promise((resolve) => (started = resolve));
  const gate = new Promise((resolve) => (release = resolve));
  f.host.workspace.fs.rename = async (...args) => {
    started();
    await gate;
    return rename(...args);
  };
  const changed = records();
  changed[1].name = "Committed later";
  let settled = false;
  const pending = f.repo.set("apiList", changed).then((result) => {
    settled = true;
    return result;
  });
  await entered;
  assert.equal(settled, false);
  assert.equal(f.repo.get("apiList", [])[1].name, "Get");
  release();
  assert.equal(await pending, true);
  assert.equal(f.repo.get("apiList", [])[1].name, "Committed later");
});

test("queued updates preserve concurrent edits and continue after a failed write", async (t) => {
  const f = await fixture(t);
  await f.repo.set("apiList", records());
  const rename = f.host.workspace.fs.rename;
  f.host.workspace.fs.rename = async () => {
    throw new Error("disk unavailable");
  };
  await assert.rejects(
    f.repo.update("apiList", (items) => {
      items[0].name = "Rejected";
      return items;
    }),
    /disk unavailable/,
  );
  assert.equal(f.repo.get("apiList", [])[0].name, "Users");
  f.host.workspace.fs.rename = rename;
  await Promise.all([
    f.repo.update("apiList", (items) => {
      items[0].name = "Updated folder";
      return items;
    }),
    f.repo.update("apiList", (items) => {
      items[1].name = "Updated request";
      return items;
    }),
  ]);
  assert.equal(f.repo.get("apiList", [])[0].name, "Updated folder");
  assert.equal(f.repo.get("apiList", [])[1].name, "Updated request");
});

test("sort is the only persisted ordering source and editor flags never reach request files", async (t) => {
  const f = await fixture(t);
  const items = records();
  Object.assign(items[1], {
    sort: -1,
    is_create: 1,
    is_changed: 1,
    save_loading: true,
    has_changed: 1,
    is_conflicted: 1,
  });
  await f.repo.set("apiList", items);
  await assert.rejects(fs.stat(path.join(f.root, "request-index.json")));
  const file = path.join(f.root, "collections/users/get-user.json");
  const saved = JSON.parse(await fs.readFile(file, "utf8"));
  for (const key of [
    "is_create",
    "is_changed",
    "save_loading",
    "has_changed",
    "is_conflicted",
  ])
    assert.equal(key in saved, false);
  const second = new f.JsonRepository(f.context, () => {});
  await second.reload();
  assert.equal(second.get("apiList", [])[0].id, "get-user");
  saved.sort = 5;
  await fs.writeFile(file, JSON.stringify(saved));
  await second.reload();
  assert.equal(second.get("apiList", [])[1].id, "get-user");
});

test("failed config writes keep the selected environment and committed config unchanged", async (t) => {
  const f = await fixture(t),
    key = "projectConfig_-1_-1";
  await f.repo.set(key, config());
  const changed = config();
  changed.http.activeEnvironment = "other";
  f.host.workspace.fs.rename = async () => {
    throw new Error("disk unavailable");
  };
  await assert.rejects(f.repo.set(key, changed), /disk unavailable/);
  assert.equal(
    f.context.globalState.get(`api-client:${key}:environment`),
    "dev",
  );
  assert.equal(f.repo.get(key, {}).http.activeEnvironment, "dev");
});

test("unsupported stored versions do not abort startup and block writes until recovery", async (t) => {
  const f = await fixture(t);
  const file = path.join(f.root, "config.json");
  await fs.mkdir(f.root, { recursive: true });
  const old = JSON.stringify({
    version: 1,
    key: "projectConfig_-1_-1",
    data: {},
  });
  await fs.writeFile(file, old);
  const failed = new f.JsonRepository(f.context, () => {});
  await failed.start();
  assert.match(failed.error, /Unsupported storage version: 1/);
  await assert.rejects(
    failed.set("apiList", records()),
    /Unsupported storage version/,
  );
  assert.equal(await fs.readFile(file, "utf8"), old);
  assert.ok(f.handlers.Change);
  const backup = await failed.backupAndReset();
  assert.equal(
    await fs.readFile(path.join(backup.path, "config.json"), "utf8"),
    old,
  );
  assert.equal(failed.error, undefined);
  await failed.set("apiList", records());
  assert.equal(failed.get("apiList", []).length, 2);
});

test("failed startup can recover after repairing JSON without restarting the extension", async (t) => {
  const f = await fixture(t);
  const file = path.join(f.root, "config.json");
  await fs.mkdir(f.root, { recursive: true });
  await fs.writeFile(file, "{broken");
  const failed = new f.JsonRepository(f.context, () => {});
  await failed.start();
  assert.ok(failed.error);
  await fs.unlink(file);
  assert.equal(await failed.retry(), true);
  assert.equal(failed.error, undefined);
  await failed.set("apiList", records());
  assert.equal(failed.get("apiList", [])[0].id, "users");
});

for (const kind of ["ai", "mcp"]) {
  test(`${kind} requests can be created, updated and reopened from disk`, async (t) => {
    const f = await fixture(t);
    const protocolData =
      kind === "ai"
        ? {
            url: "https://api.openai.com/v1",
            ai: {
              model: "",
              system: "",
              messages: [],
              temperature: 1,
              maxOutputTokens: 2048,
            },
          }
        : {
            url: "",
            mcp: { transport: "http", headers: {}, command: "", args: [] },
          };
    for (const key of ["apiList", "apiList:project"]) {
      const folder = {
        id: "folder",
        parentId: "0",
        kind: "folder",
        name: "Collection",
        sort: 0,
      };
      const root = {
        ...protocolData,
        id: `${kind}-root`,
        parentId: "0",
        kind,
        name: "Root request",
        sort: 1,
      };
      const nested = {
        ...protocolData,
        id: `${kind}-nested`,
        parentId: folder.id,
        kind,
        name: "Nested request",
        sort: 2,
      };
      const expected = [folder, root, nested];
      assert.equal(
        await f.repo.update(key, (rows) => [...rows, ...expected]),
        true,
      );
      const second = new f.JsonRepository(f.context, () => {});
      await second.reload();
      assert.equal(second.error, undefined);
      assert.deepEqual(
        JSON.parse(JSON.stringify(second.get(key, []))),
        expected,
      );
      const updated = {
        ...nested,
        name: "Updated request",
        ...(kind === "ai"
          ? {
              ai: {
                ...nested.ai,
                model: "test-model",
                messages: [{ role: "user", content: "hello" }],
              },
            }
          : {
              mcpOperation: {
                method: "tools/call",
                name: "echo",
                arguments: { message: "hello" },
              },
            }),
      };
      assert.equal(
        await second.update(key, (rows) =>
          rows.map((row) => (row.id === nested.id ? updated : row)),
        ),
        true,
      );
      const third = new f.JsonRepository(f.context, () => {});
      await third.reload();
      assert.deepEqual(
        JSON.parse(
          JSON.stringify(
            third.get(key, []).find((row) => row.id === nested.id),
          ),
        ),
        updated,
      );
    }
    assert.deepEqual(f.errors, []);
  });
}
