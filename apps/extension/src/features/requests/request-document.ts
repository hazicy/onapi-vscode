import * as vscode from "vscode";
import { cloneDeep, isEqual, isPlainObject } from "lodash";
import { requestDefinition } from "@onapi/domain";
import { APIS_BASE_DEFAULT_DATA } from "@onapi/domain/requests/constants/common";
import type { EditorRecord } from "@onapi/domain/requests/record";
import type { ApiDetailsData } from "@onapi/domain/requests/types/api";
import {
  readEditorRequest,
  writeEditorRequest,
  writeEditorRequestFile,
} from "./request-storage";

export interface RequestSnapshot {
  workspace: string;
  draft: ApiDetailsData;
  baseline?: ApiDetailsData;
  dirty: boolean;
}
export type RequestDocumentChange =
  | { type: "edit" | "replace" | "dispose" }
  | { type: "save"; definition: ApiDetailsData; submitted: ApiDetailsData };

/** Copy changed branches once and reuse immutable subtrees across undo entries. */
function share(previous: any, next: any): any {
  if (previous === next) {
    return previous;
  }
  if (!Array.isArray(next) && !isPlainObject(next)) {
    return isEqual(previous, next) ? previous : cloneDeep(next);
  }
  const array = Array.isArray(next);
  const compatible = array ? Array.isArray(previous) : isPlainObject(previous);
  const keys = Object.keys(next);
  let equal = compatible && keys.length === Object.keys(previous).length;
  const result: any = array ? [] : {};
  for (const key of keys) {
    const value = share(compatible ? previous[key] : undefined, next[key]);
    Object.defineProperty(result, key, {
      value,
      enumerable: true,
      writable: true,
      configurable: true,
    });
    equal = equal && Object.hasOwn(previous, key) && value === previous[key];
  }
  return equal ? previous : result;
}

export class RequestDocument implements vscode.CustomDocument {
  private current: ApiDetailsData;
  private saved?: ApiDetailsData;
  private readonly empty: ApiDetailsData;
  private readonly changes = new vscode.EventEmitter<RequestDocumentChange>();
  readonly onDidChange = this.changes.event;
  private version = 0;
  private savedVersion = 0;
  private sequence = 0;
  private disposed = false;
  private deleted = false;
  private writing: Promise<void> = Promise.resolve();

  constructor(
    readonly uri: vscode.Uri,
    readonly context: vscode.ExtensionContext,
    readonly workspace: string,
    data: ApiDetailsData,
    baseline: ApiDetailsData | undefined,
    private readonly changed: (
      event: vscode.CustomDocumentEditEvent<RequestDocument>,
    ) => void,
    restoredDirty = false,
  ) {
    this.current = requestDefinition(cloneDeep(data));
    this.saved = baseline && share(this.current, requestDefinition(baseline));
    const defaults =
      APIS_BASE_DEFAULT_DATA[
        data.kind as keyof typeof APIS_BASE_DEFAULT_DATA
      ] ?? {};
    this.empty = requestDefinition({
      ...cloneDeep(defaults),
      id: data.id,
      parentId: data.parentId,
      kind: data.kind,
      name: "",
    } as ApiDetailsData);
    if (restoredDirty || !isEqual(this.current, this.saved ?? this.empty)) {
      this.version = this.sequence = 1;
    }
  }

  get draft() {
    return this.current;
  }
  get baseline() {
    return this.saved;
  }
  get dirty() {
    return this.version !== this.savedVersion;
  }

  announceInitialChange() {
    if (!this.saved && this.dirty && !this.disposed) {
      const after = this.current;
      const version = this.version;
      this.changed({
        document: this,
        label: "New Request",
        undo: () => this.apply(this.empty, 0),
        redo: () => this.apply(after, version),
      });
    }
  }

  edit(data: ApiDetailsData | EditorRecord) {
    if (this.disposed || this.deleted) {
      throw new Error("Request document is closed or deleted");
    }
    if (data.id !== this.current.id) {
      throw new Error("Cannot change a request's identity");
    }
    const before = this.current;
    const after = share(before, requestDefinition(data));
    if (after === before) {
      return;
    }
    const beforeVersion = this.version;
    const afterVersion = ++this.sequence;
    this.apply(after, afterVersion, false);
    this.changed({
      document: this,
      label: "Edit Request",
      undo: () => this.apply(before, beforeVersion),
      redo: () => this.apply(after, afterVersion),
    });
  }

  private apply(data: ApiDetailsData, version = this.version, notify = true) {
    this.current = data;
    this.version = version;
    this.changes.fire({ type: notify ? "replace" : "edit" });
  }

  acceptStored(data: ApiDetailsData) {
    if (this.dirty || this.disposed) {
      return;
    }
    this.saved = share(this.current, requestDefinition(data));
    if (this.current !== this.saved) {
      this.apply(this.saved!);
    }
  }

  snapshot(): RequestSnapshot {
    return {
      workspace: this.workspace,
      draft: this.current,
      baseline: this.saved,
      dirty: this.dirty,
    };
  }

  async save(token: vscode.CancellationToken) {
    const submitted = this.current;
    const version = this.version;
    const write = this.writing
      .catch(() => {})
      .then(async () => {
        const definition = await writeEditorRequest(
          this.context,
          this.uri,
          this.workspace,
          submitted,
          !!this.saved,
          () => this.check(token),
          token,
        );
        this.saved = definition;
        this.savedVersion = version;
        if (this.current === submitted) {
          this.current = definition;
        }
        if (!this.disposed) {
          this.changes.fire({ type: "save", definition, submitted });
        }
      });
    this.writing = write;
    await write;
  }

  async saveAs(destination: vscode.Uri, token: vscode.CancellationToken) {
    this.check(token);
    if (destination.scheme === "onapi-editor") {
      throw new Error("Choose a file location for Save As");
    }
    await writeEditorRequestFile(destination, this.current, token);
  }

  async revert(token: vscode.CancellationToken) {
    await this.writing.catch(() => {});
    this.check(token);
    const saved = await readEditorRequest(
      this.context,
      this.uri,
      this.workspace,
      this.current.id,
    );
    this.check(token);
    if (!saved && this.saved) {
      throw new Error("This request was removed from storage");
    }
    this.saved = saved && share(this.current, requestDefinition(saved));
    this.savedVersion = ++this.sequence;
    this.apply(this.saved ?? this.empty, this.savedVersion);
  }

  private check(token: vscode.CancellationToken) {
    if (token.isCancellationRequested) {
      throw new vscode.CancellationError();
    }
    if (this.disposed || this.deleted) {
      throw new Error("Request document is closed or deleted");
    }
  }

  markDeleted() {
    this.deleted = true;
  }
  dispose() {
    this.disposed = true;
    this.changes.fire({ type: "dispose" });
    this.changes.dispose();
  }
}
