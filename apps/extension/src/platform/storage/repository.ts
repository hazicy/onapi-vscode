import {
  requestKindSchema,
  aiEditorRecordSchema,
  mcpEditorRecordSchema,
} from "@onapi/domain/requests/record";
import { requestDefinition } from "@onapi/domain";
import * as vscode from "vscode";
import { isDeepStrictEqual } from "node:util";
import { randomUUID, createHash, createHmac } from "node:crypto";
import { storageChanged } from "./events";
import { repositories } from "./index";

type Data = Record<string, any>;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const segment = (id: string) => encodeURIComponent(id).replace(/\./g, "%2E");
const object = (v: any) => v && typeof v === "object" && !Array.isArray(v);

/** Local repository boundary: business callers use snapshots; all I/O is queued. */
export class JsonRepository {
  private secretSalt = "";
  private loadFailure?: string;
  get error() {
    return this.loadFailure;
  }
  private values = new Map<string, any>();
  private queue: Promise<void> = Promise.resolve();
  private timer?: ReturnType<typeof setTimeout>;
  readonly root: vscode.Uri;
  constructor(
    private context: vscode.ExtensionContext,
    private changed: () => void,
  ) {
    this.root = vscode.Uri.joinPath(context.globalStorageUri, ".api-client");
  }
  has(key: string) {
    return this.values.has(key);
  }
  get(key: string, fallback: any) {
    return clone(this.values.get(key) ?? fallback);
  }
  set(key: string, value: any): Promise<boolean> {
    const snapshot = clone(value);
    return this.update(key, () => snapshot);
  }
  update(key: string, change: (value: any) => any): Promise<boolean> {
    return this.enqueue(async () => {
      if (this.loadFailure) {
        throw new Error(this.loadFailure);
      }
      let snapshot = clone(
        change(this.get(key, key.startsWith("apiList") ? [] : {})),
      );
      if (/^apiList(?::[^:]+)?$/.test(key) && !key.endsWith(":history")) {
        snapshot = snapshot.map(requestDefinition);
      }
      this.validate(key, snapshot);
      await this.write(key, snapshot);
      this.values.set(key, snapshot);
      storageChanged.fire(key);
      return true;
    });
  }
  private validate(key: string, value: any) {
    if (key.endsWith(":history") || /^apiList(?::[^:]+)?$/.test(key)) {
      if (!Array.isArray(value)) {
        throw new Error("Expected an array");
      }
    }
    if (key.endsWith(":history")) {
      return;
    }
    if (/^apiList(?::[^:]+)?$/.test(key)) {
      const byId = new Map<string, any>();
      for (const row of value) {
        if (
          !object(row) ||
          typeof row.id !== "string" ||
          !row.id ||
          byId.has(row.id) ||
          typeof row.parentId !== "string" ||
          !requestKindSchema.safeParse(row.kind).success
        ) {
          throw new Error("Missing or duplicate request ID, parentId or kind");
        }
        if (row.kind === "ai") {
          aiEditorRecordSchema.parse(row);
        }
        if (row.kind === "mcp") {
          mcpEditorRecordSchema.parse(row);
        }
        if (["api", "graphql"].includes(row.kind) && !object(row.request)) {
          throw new Error("Invalid request definition");
        }
        if (
          ["item", "target_id", "parent_id", "target_type", "is_deleted"].some(
            (key) => key in row,
          )
        ) {
          throw new Error("Unsupported request record fields");
        }
        byId.set(row.id, row);
      }
      for (const row of value) {
        const seen = new Set([row.id]);
        let parent = row.parentId;
        while (parent !== "0") {
          if (seen.has(parent)) {
            throw new Error("Circular collection hierarchy");
          }
          seen.add(parent);
          const folder = byId.get(parent);
          if (
            !folder ||
            (folder.kind !== "folder" &&
              !(folder.kind === "socket" && row.kind === "socket_method"))
          ) {
            throw new Error("Invalid parent collection");
          }
          parent = folder.parentId;
        }
      }
    }
    if (!key.startsWith("projectConfig_")) {
      return;
    }
    if (!object(value)) {
      throw new Error("Expected project configuration");
    }
    if (!value.http) {
      return;
    }
    if (!object(value.http.collection) || "item" in value.http.collection) {
      throw new Error("Collection settings must not contain request records");
    }
    const environments = new Set<string>();
    if (!Array.isArray(value.http.environments)) {
      throw new Error("Invalid environments");
    }
    for (const env of value.http.environments) {
      if (
        !object(env) ||
        typeof env.id !== "string" ||
        !env.id ||
        environments.has(env.id) ||
        !Array.isArray(env.values)
      ) {
        throw new Error("Missing or duplicate environment ID");
      }
      environments.add(env.id);
    }
  }
  private enqueue<T>(work: () => Promise<T>): Promise<T> {
    const pending = this.queue.then(work);
    this.queue = pending.then(
      () => {},
      () => {},
    );
    return pending;
  }
  flush() {
    return this.queue;
  }
  private base(key: string) {
    return key === "projectConfig_-1_-1"
      ? this.root
      : vscode.Uri.joinPath(this.root, "projects", segment(key));
  }
  private requestBase(key: string) {
    return key === "apiList"
      ? this.root
      : vscode.Uri.joinPath(this.root, "projects", segment(key));
  }
  private get secretScope() {
    return createHash("sha256").update(this.root.toString()).digest("hex");
  }
  private async protect(
    value: any,
    location: string,
    restore = false,
  ): Promise<any> {
    if (
      object(value) &&
      Object.keys(value).length === 1 &&
      typeof value.$secret === "string"
    ) {
      return restore
        ? JSON.parse((await this.context.secrets.get(value.$secret)) || '""')
        : value;
    }
    if (Array.isArray(value)) {
      return Promise.all(
        value.map((v, i) =>
          this.protect(
            v,
            `${location}/${v?.id ?? v?.param_id ?? v?.key ?? i}`,
            restore,
          ),
        ),
      );
    }
    if (!object(value)) {
      return value;
    }
    const result: Data = {};
    const sensitiveRow =
      /authorization|cookie|token|api[-_]?key|password|secret/i.test(
        String(value.key ?? value.name ?? ""),
      ) || value.type === "secret";
    for (const [key, child] of Object.entries(value)) {
      if (
        !restore &&
        child !== "" &&
        child !== null &&
        child !== undefined &&
        (/auth|cookie|token|password|secret|api[-_]?key|^(?:headersText|argsText)$/i.test(
          key,
        ) ||
          (key === "url" &&
            typeof child === "string" &&
            /[?&](?:token|api[-_]?key|password|secret)=/i.test(child)) ||
          (sensitiveRow && key === "value"))
      ) {
        const ref = `api-client:${this.secretScope}:${location}/${key}`;
        const encoded = JSON.stringify(child);
        const refWithVersion = `${ref}:${createHmac("sha256", this.secretSalt).update(encoded).digest("hex")}`;
        await this.context.secrets.store(refWithVersion, encoded);
        result[key] = { $secret: refWithVersion };
      } else {
        result[key] = await this.protect(child, `${location}/${key}`, restore);
      }
    }
    return result;
  }
  private async read(uri: vscode.Uri) {
    return JSON.parse(
      Buffer.from(await vscode.workspace.fs.readFile(uri)).toString("utf8"),
    );
  }
  private async atomic(uri: vscode.Uri, value: any, jsonl = false) {
    await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(uri, ".."));
    const temp = uri.with({ path: `${uri.path}.${randomUUID()}.tmp` });
    try {
      await vscode.workspace.fs.writeFile(
        temp,
        Buffer.from(
          jsonl
            ? value.map((v: any) => JSON.stringify(v)).join("\n") + "\n"
            : JSON.stringify(value, null, 2) + "\n",
        ),
      );
      await vscode.workspace.fs.rename(temp, uri, { overwrite: true });
    } finally {
      try {
        await vscode.workspace.fs.delete(temp);
      } catch {
        /* Already renamed. */
      }
    }
  }
  private history(key: string) {
    const scope = createHash("sha256")
      .update(this.root.toString() + key)
      .digest("hex");
    return vscode.Uri.joinPath(
      this.context.globalStorageUri,
      "history",
      `${scope}.jsonl`,
    );
  }
  private async write(key: string, source: any) {
    let value = await this.protect(source, key);
    if (key.endsWith(":history")) {
      await this.atomic(this.history(key), value, true);
      return;
    }
    if (/^apiList(?::[^:]+)?$/.test(key)) {
      const base = this.requestBase(key);
      const files = new Map<string, any>();
      const byId = new Map<string, any>(value.map((row: any) => [row.id, row]));
      const directory = (row: any): string =>
        row.parentId === "0"
          ? "collections"
          : `${directory(byId.get(row.parentId))}/${segment(row.parentId)}`;
      for (const row of value) {
        const prefix = directory(row);
        const name =
          row.kind === "folder"
            ? `${prefix}/${segment(row.id)}/collection.json`
            : `${prefix}/${row.id === "collection" ? "%63ollection" : segment(row.id)}.json`;
        files.set(name, row);
      }
      for (const [name, row] of files) {
        await this.atomic(vscode.Uri.joinPath(base, name), row);
      }
      for (const name of await this.list(base, "collections")) {
        if (!files.has(name)) {
          await vscode.workspace.fs.delete(vscode.Uri.joinPath(base, name));
        }
      }
      return;
    }
    if (!key.startsWith("projectConfig_")) {
      await this.atomic(
        vscode.Uri.joinPath(this.root, "data", `${segment(key)}.json`),
        value,
      );
      return;
    }
    const base = this.base(key);
    const protocolEnvironment = value.envDetailKeys;
    const activeEnvironment = value.http?.activeEnvironment;
    delete value.envDetailKeys;
    const files = new Map<string, any>();
    for (const env of value.envList || []) {
      if (env.env_id === null || env.env_id === undefined) {
        throw new Error("Environment requires an ID");
      }
      files.set(
        `environments/protocols/${segment(String(env.env_id))}.json`,
        env,
      );
    }
    delete value.envList;
    if (value.http) {
      for (const env of value.http.environments || []) {
        if (!env.id) {
          throw new Error("Environment requires an ID");
        }
        files.set(`environments/${segment(env.id)}.json`, env);
      }
      delete value.http.environments;
      delete value.http.activeEnvironment;
    }
    files.set("config.json", { version: 2, key, data: value });
    for (const [name, data] of files) {
      await this.atomic(vscode.Uri.joinPath(base, name), data);
    }
    for (const name of await this.list(base)) {
      if (name.startsWith("environments/") && !files.has(name)) {
        await vscode.workspace.fs.delete(vscode.Uri.joinPath(base, name));
      }
    }
    await this.context.globalState.update(
      `api-client:${key}:protocolEnvironment`,
      protocolEnvironment,
    );
    if (value.http) {
      await this.context.globalState.update(
        `api-client:${key}:environment`,
        activeEnvironment,
      );
    }
  }
  private async list(base: vscode.Uri, prefix = ""): Promise<string[]> {
    let entries: [string, vscode.FileType][];
    try {
      entries = await vscode.workspace.fs.readDirectory(
        vscode.Uri.joinPath(base, prefix),
      );
    } catch (e) {
      if ((e as any).code === "FileNotFound") {
        return [];
      }
      throw e;
    }
    const result: string[] = [];
    for (const [name, type] of entries) {
      const relative = prefix ? `${prefix}/${name}` : name;
      if (type === vscode.FileType.Directory) {
        result.push(...(await this.list(base, relative)));
      } else if (type === vscode.FileType.File && name.endsWith(".json")) {
        result.push(relative);
      }
    }
    return result;
  }
  async reload() {
    const next = new Map<string, any>();
    const all = await this.list(this.root);
    for (const configPath of all.filter(
      (p) => p === "config.json" || /^projects\/[^/]+\/config.json$/.test(p),
    )) {
      const envelope = await this.read(
        vscode.Uri.joinPath(this.root, configPath),
      );
      if (envelope.version !== 2) {
        throw new Error(
          `Unsupported storage version: ${envelope.version} (${configPath}); expected 2`,
        );
      }
      if (typeof envelope.key !== "string" || !object(envelope.data)) {
        throw new Error(`Invalid config: ${configPath}`);
      }
      const base = this.base(envelope.key);
      const data = envelope.data;
      data.envDetailKeys = this.context.globalState.get(
        `api-client:${envelope.key}:protocolEnvironment`,
        "1",
      );
      const paths = await this.list(base);
      data.envList = [];
      for (const name of paths.filter((p) =>
        /^environments\/protocols\/[^/]+\.json$/.test(p),
      )) {
        const env = await this.read(vscode.Uri.joinPath(base, name));
        if (
          !object(env) ||
          env.env_id === null ||
          env.env_id === undefined ||
          typeof env.name !== "string"
        ) {
          throw new Error(`Invalid environment: ${name}`);
        }
        data.envList.push(env);
      }
      data.envList.sort((a: any, b: any) => (a.sort || 0) - (b.sort || 0));
      if (data.http) {
        data.http.environments = [];
        for (const name of paths.filter((p) =>
          /^environments\/[^/]+\.json$/.test(p),
        )) {
          const env = await this.read(vscode.Uri.joinPath(base, name));
          if (
            !object(env) ||
            typeof env.id !== "string" ||
            !Array.isArray(env.values)
          ) {
            throw new Error(`Invalid environment: ${name}`);
          }
          data.http.environments.push(env);
        }
        data.http.activeEnvironment = this.context.globalState.get(
          `api-client:${envelope.key}:environment`,
          "default",
        );
      }
      this.validate(envelope.key, data);
      next.set(envelope.key, await this.protect(data, envelope.key, true));
    }
    for (const name of all.filter((p) => /^data\/[^/]+\.json$/.test(p))) {
      const key = decodeURIComponent(name.slice(5, -5));
      next.set(
        key,
        await this.protect(
          await this.read(vscode.Uri.joinPath(this.root, name)),
          key,
          true,
        ),
      );
    }
    const requestKeys = new Set<string>(["apiList"]);
    for (const name of all.filter((p) => /^projects\/apiList[^/]+\//.test(p))) {
      requestKeys.add(decodeURIComponent(name.split("/")[1]));
    }
    for (const key of requestKeys) {
      const base = this.requestBase(key);
      const rows = [];
      for (const name of await this.list(base, "collections")) {
        rows.push(
          await this.protect(
            await this.read(vscode.Uri.joinPath(base, name)),
            key,
            true,
          ),
        );
      }
      this.validate(key, rows);
      rows.sort(
        (a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.id.localeCompare(b.id),
      );
      next.set(key, rows);
    }
    // Histories are private to this workspace and retain their own snapshots.
    for (const [key, value] of this.values) {
      if (key.endsWith(":history")) {
        next.set(key, value);
      }
    }
    this.values = next;
    this.loadFailure = undefined;
  }
  async retry(): Promise<boolean> {
    return this.enqueue(async () => {
      const previous = this.values;
      const previousError = this.loadFailure;
      try {
        const saltKey = `api-client:${this.secretScope}:salt`;
        this.secretSalt =
          (await this.context.secrets.get(saltKey)) || randomUUID();
        await this.context.secrets.store(saltKey, this.secretSalt);
        await this.reload();
        const user = this.context.globalState.get<any>("userConfig") || {};
        const projects = new Set(
          [
            "-1",
            ...(user.teamProjectList || []).flatMap((team: any) =>
              (team.project || []).map((project: any) => project.project_id),
            ),
            user.currentProject?.project_id,
          ].filter(Boolean),
        );
        for (const id of projects) {
          await this.loadHistory(
            id === "-1" ? "apiList:history" : `apiList:${id}:history`,
          );
        }
        if (previousError || !isDeepStrictEqual(previous, this.values)) {
          this.changed();
        }
        return true;
      } catch (error) {
        this.loadFailure =
          error instanceof Error ? error.message : String(error);
        if (this.loadFailure !== previousError) {
          this.changed();
        }
        return false;
      }
    });
  }

  /** Explicit recovery action: preserve the unsupported/broken directory intact. */
  async backupAndReset(): Promise<vscode.Uri> {
    const backup = this.root.with({
      path: `${this.root.path}.backup-${randomUUID()}`,
    });
    await this.enqueue(async () => {
      if (!this.loadFailure) {
        throw new Error("Storage is already available");
      }
      await vscode.workspace.fs.rename(this.root, backup);
      this.values.clear();
      this.loadFailure = undefined;
    });
    await this.retry();
    return backup;
  }

  async start() {
    repositories.set(this.context, this);
    await this.retry();
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(this.root, "**/*.json"),
    );
    const refresh = () => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        void this.retry();
      }, 250);
    };
    this.context.subscriptions.push(
      watcher,
      watcher.onDidCreate(refresh),
      watcher.onDidChange(refresh),
      watcher.onDidDelete(refresh),
      { dispose: () => clearTimeout(this.timer) },
    );
    repositories.set(this.context, this);
  }
  async loadHistory(key: string) {
    try {
      const text = Buffer.from(
        await vscode.workspace.fs.readFile(this.history(key)),
      ).toString("utf8");
      const entries = [];
      for (const line of text.split("\n").filter(Boolean)) {
        try {
          const row = JSON.parse(line);
          if (
            row.id &&
            typeof row.sentAt === "number" &&
            typeof row.request?.id === "string" &&
            typeof row.request.kind === "string"
          ) {
            entries.push(await this.protect(row, key, true));
          }
        } catch {
          /* Ignore interrupted JSONL records. */
        }
      }
      this.values.set(key, entries.slice(0, 200));
    } catch (e) {
      if ((e as any).code !== "FileNotFound") {
        throw e;
      }
    }
  }
}
