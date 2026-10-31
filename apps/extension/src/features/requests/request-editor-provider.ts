import {
  getProjectShareData,
  setProjectShareData,
} from "../sharing/share-data";
import * as vscode from "vscode";
import {
  getEditorInput,
  setEditorInput,
} from "../../platform/webviews/custom-editor";
import {
  getApiListName,
  parseEditorRequest,
  readEditorJson,
  readEditorRequest,
} from "./request-storage";
import { RequestDocument, type RequestSnapshot } from "./request-document";
import { resolveRequestEditor } from "./request-editor";

export class RequestEditorProvider implements vscode.CustomEditorProvider<RequestDocument> {
  private readonly newDocuments = new WeakSet<RequestDocument>();
  private readonly changes = new vscode.EventEmitter<
    vscode.CustomDocumentEditEvent<RequestDocument>
  >();
  readonly onDidChangeCustomDocument = this.changes.event;

  constructor(private readonly context: vscode.ExtensionContext) {
    context.subscriptions.push(this.changes);
  }

  async openCustomDocument(
    uri: vscode.Uri,
    openContext: vscode.CustomDocumentOpenContext,
    token: vscode.CancellationToken,
  ) {
    if (token.isCancellationRequested) {
      throw new vscode.CancellationError();
    }
    let snapshot: RequestSnapshot;
    if (openContext.backupId) {
      const backup = await readEditorJson(
        vscode.Uri.parse(openContext.backupId),
      );
      snapshot = {
        workspace: backup.workspace,
        draft: parseEditorRequest(backup.draft),
        baseline: backup.baseline && parseEditorRequest(backup.baseline),
        dirty: backup.dirty,
      };
    } else if (uri.scheme !== "onapi-editor") {
      const data = parseEditorRequest(await readEditorJson(uri));
      snapshot = {
        workspace: getApiListName(this.context),
        draft: data,
        baseline: data,
        dirty: false,
      };
    } else {
      const input = getEditorInput(this.context, uri);
      if (!input) {
        throw new Error("Request editor input is missing");
      }
      const reference = input.data as { id: string; kind?: string };
      const saved = await readEditorRequest(
        this.context,
        uri,
        input.workspace,
        reference.id,
      );
      if (!saved && !reference.kind) {
        throw new Error("Request was removed from storage");
      }
      snapshot = {
        workspace: input.workspace,
        draft: saved ?? parseEditorRequest(input.data),
        baseline: saved,
        dirty: false,
      };
    }
    if (token.isCancellationRequested) {
      throw new vscode.CancellationError();
    }
    if (snapshot.workspace !== getApiListName(this.context)) {
      throw new Error("Switch to this request's workspace before opening it");
    }
    const document = new RequestDocument(
      uri,
      this.context,
      snapshot.workspace,
      snapshot.draft,
      snapshot.baseline,
      (event) => this.changes.fire(event),
      snapshot.dirty,
    );
    if (!openContext.backupId && !snapshot.baseline) {
      this.newDocuments.add(document);
    }
    return document;
  }

  resolveCustomEditor(
    document: RequestDocument,
    panel: vscode.WebviewPanel,
    token: vscode.CancellationToken,
  ) {
    if (token.isCancellationRequested) {
      return;
    }
    const input = getEditorInput(this.context, document.uri);
    resolveRequestEditor(
      document,
      this.context,
      panel,
      typeof input?.option === "number" ? input.option : Date.now(),
      document.uri.scheme === "onapi-editor"
        ? document.draft.id
        : document.uri.toString(),
    );
    if (this.newDocuments.delete(document)) {
      void Promise.resolve().then(() => document.announceInitialChange());
    }
  }

  async saveCustomDocument(
    document: RequestDocument,
    token: vscode.CancellationToken,
  ) {
    await document.save(token);
    if (document.uri.scheme === "onapi-editor") {
      const input = getEditorInput(this.context, document.uri);
      await setEditorInput(this.context, document.uri, {
        workspace: document.workspace,
        data: { id: document.draft.id },
        option: input?.option,
      }).catch((error) =>
        console.error("Failed to update request editor reference", error),
      );
    }
    if (
      document.uri.scheme === "onapi-editor" &&
      document.workspace === getApiListName(this.context)
    ) {
      const shares = getProjectShareData(this.context);
      if (shares?.[document.draft.id]) {
        shares[document.draft.id].share_time = Date.now();
        setProjectShareData(shares, this.context);
      }
    }
  }
  saveCustomDocumentAs(
    document: RequestDocument,
    destination: vscode.Uri,
    token: vscode.CancellationToken,
  ) {
    return document.saveAs(destination, token);
  }
  revertCustomDocument(
    document: RequestDocument,
    token: vscode.CancellationToken,
  ) {
    return document.revert(token);
  }

  async backupCustomDocument(
    document: RequestDocument,
    context: vscode.CustomDocumentBackupContext,
    token: vscode.CancellationToken,
  ): Promise<vscode.CustomDocumentBackup> {
    if (token.isCancellationRequested) {
      throw new vscode.CancellationError();
    }
    await vscode.workspace.fs.writeFile(
      context.destination,
      new TextEncoder().encode(JSON.stringify(document.snapshot())),
    );
    return {
      id: context.destination.toString(),
      delete: () => {
        void vscode.workspace.fs
          .delete(context.destination)
          .then(undefined, (error) => {
            if (
              !(
                error instanceof vscode.FileSystemError &&
                error.code === "FileNotFound"
              )
            ) {
              console.error("Failed to delete request backup", error);
            }
          });
      },
    };
  }
}
