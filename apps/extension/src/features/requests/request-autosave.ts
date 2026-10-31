import { clearTimeout, setTimeout } from "node:timers";
import * as vscode from "vscode";
import { cloneDeep, isEqual } from "lodash";
import { requestDefinition } from "@onapi/domain";
import type { EditorRecord } from "@onapi/domain/requests/record";
import type { ApiDetailsData } from "@onapi/domain/requests/types/api";
import { DEFAULT_TARGET_NAME } from "../../app/config";
import { postRequestPanelResponse } from "../../platform/webviews/request-panel-channel";
import { showTabName } from "../../platform/host-utils";
import { getProtocolIcon } from "../sidebar/protocol-icon";
import { getMaxSort } from "../collections/collection-order";
import {
  getApiList,
  getApiListName,
  updateApiListForWorkspace,
} from "./request-storage";
import { setRequestDraft } from "./request-status";
import {
  getProjectShareData,
  setProjectShareData,
} from "../sharing/share-data";

type Document = {
  context: vscode.ExtensionContext;
  workspace: string;
  draft: ApiDetailsData;
  baseline?: ApiDetailsData;
  revision: number;
  panel?: vscode.WebviewPanel;
  timer?: ReturnType<typeof setTimeout>;
  writing?: Promise<boolean>;
  requestId?: string;
  deleted: boolean;
};

// Closed documents remain here only while they contain an unsaved draft.
const documents = new Map<string, Document>();
const key = (workspace: string, id: string) => JSON.stringify([workspace, id]);
const dirty = (document: Document) =>
  !isEqual(requestDefinition(document.draft), document.baseline);

function cancelTimer(document: Document) {
  if (document.timer) {
    clearTimeout(document.timer);
    document.timer = undefined;
  }
}

function publishDraft(document: Document) {
  const changed = dirty(document);
  setRequestDraft(
    document.workspace,
    document.draft.id,
    changed ? document.draft : undefined,
  );
  if (document.panel) {
    const title =
      showTabName(
        document.draft.name ||
          DEFAULT_TARGET_NAME[document.draft.kind] ||
          "HTTP Request",
      ) + (changed ? " ⚈" : "");
    if (document.panel.title !== title) {
      document.panel.title = title;
    }
  }
}

function schedule(document: Document) {
  cancelTimer(document);
  if (dirty(document) || document.writing) {
    document.timer = setTimeout(() => flush(document), 600);
  }
}

export function getRequestAutosaveDraft(workspace: string, id: string) {
  const document = documents.get(key(workspace, id));
  return document && dirty(document) ? cloneDeep(document.draft) : undefined;
}

export function attachRequestAutosave(
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
  data: ApiDetailsData | EditorRecord,
) {
  const workspace = getApiListName(context);
  const documentKey = key(workspace, data.id);
  let document = documents.get(documentKey);
  if (!document) {
    const saved = getApiList(context).find((item) => item.id === data.id);
    document = {
      context,
      workspace,
      draft: cloneDeep(data) as ApiDetailsData,
      baseline: saved ? requestDefinition(cloneDeep(saved)) : undefined,
      revision: 0,
      deleted: false,
    };
    documents.set(documentKey, document);
  }
  document.panel = panel;
  publishDraft(document);
  if (dirty(document)) {
    schedule(document);
  }
  return document;
}

function documentFor(
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
  data: ApiDetailsData | EditorRecord,
) {
  return (
    [...documents.values()].find((document) => document.panel === panel) ??
    attachRequestAutosave(context, panel, data)
  );
}

export function updateRequestDraft(
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
  data: ApiDetailsData | EditorRecord,
  requestId?: string,
) {
  const document = documentFor(context, panel, data);
  document.draft = cloneDeep(data) as ApiDetailsData;
  document.requestId = requestId;
  document.revision++;
  publishDraft(document);
  schedule(document);
}

async function commit(
  document: Document,
  automatic: boolean,
): Promise<boolean> {
  const revision = document.revision;
  const submitted = cloneDeep(document.draft);
  const definition = requestDefinition(cloneDeep(submitted));
  const requestId = document.requestId;
  if (!definition.name?.trim()) {
    definition.name = DEFAULT_TARGET_NAME[definition.kind] || "HTTP Request";
  }
  let missing = false;
  try {
    const saved = await updateApiListForWorkspace(
      document.context,
      document.workspace,
      (items) => {
        if (document.deleted) {
          return items;
        }
        const index = items.findIndex((item) => item.id === definition.id);
        if (index >= 0) {
          items[index] = definition;
        } else if (!document.baseline) {
          definition.sort = getMaxSort(items, definition.parentId);
          items.push(definition);
        } else {
          // An existing request was removed while this write waited in the queue.
          missing = true;
        }
        return items;
      },
    );
    if (document.deleted || missing) {
      discardRequestAutosaves(document.workspace, [definition.id]);
      return true;
    }
    if (!saved) {
      throw new Error("Failed to save requests. Please try again.");
    }
    document.baseline = definition;
    if (document.revision === revision) {
      document.draft = definition;
    }
    publishDraft(document);
    if (document.panel) {
      postRequestPanelResponse(document.panel.webview, {
        action: "requestSaved",
        ...(requestId ? { requestId } : {}),
        data: { definition, submitted },
      });
      const icon = getProtocolIcon(document.context, definition);
      if (icon) {
        document.panel.iconPath = icon;
      }
    }
    if (document.workspace === getApiListName(document.context)) {
      const shareData = getProjectShareData(document.context);
      if (shareData?.[definition.id]) {
        shareData[definition.id].share_time = Date.now();
        setProjectShareData(shareData, document.context);
      }
    }
    if (!automatic && document.panel) {
      void vscode.window.showInformationMessage("Save Successfully！🎉");
    }
    return true;
  } catch (error) {
    if (document.deleted) {
      return true;
    }
    const message = error instanceof Error ? error.message : String(error);
    if (document.panel && requestId) {
      postRequestPanelResponse(document.panel.webview, {
        action: "requestPanelError",
        requestId,
        data: {
          action: automatic ? "updateApiActiveData" : "saveApiData",
          error: { code: "SAVE_FAILED", message },
        },
      });
    }
    void vscode.window.showErrorMessage(message);
    return false;
  }
}

async function flush(document: Document, automatic = true): Promise<boolean> {
  cancelTimer(document);
  if (document.writing) {
    await document.writing;
  }
  if (document.deleted || !dirty(document)) {
    return true;
  }
  // All callers share this promise; storage never receives parallel snapshots
  // of the same document from manual save, debounce, close and shutdown.
  if (document.writing) {
    return flush(document, automatic);
  }
  document.writing = commit(document, automatic);
  const saved = await document.writing;
  document.writing = undefined;
  if (saved && !document.panel && !dirty(document)) {
    documents.delete(key(document.workspace, document.draft.id));
  }
  return saved;
}

export async function saveRequestDraft(
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
  data: ApiDetailsData | EditorRecord,
  requestId?: string,
) {
  updateRequestDraft(context, panel, data, requestId);
  return flush(documentFor(context, panel, data), false);
}

export async function closeRequestAutosave(panel: vscode.WebviewPanel) {
  const document = [...documents.values()].find((item) => item.panel === panel);
  if (!document) {
    return;
  }
  document.panel = undefined;
  const saved = await flush(document);
  if (saved && !document.panel && !dirty(document)) {
    documents.delete(key(document.workspace, document.draft.id));
  }
}

export function discardRequestAutosaves(
  workspace: string,
  ids: Iterable<string>,
) {
  for (const id of ids) {
    const document = documents.get(key(workspace, id));
    if (document) {
      document.deleted = true;
      cancelTimer(document);
      documents.delete(key(workspace, id));
      setRequestDraft(workspace, id);
    }
  }
}

export async function flushAllRequestAutosaves() {
  return (
    await Promise.all(
      [...documents.values()].map((document) => flush(document)),
    )
  ).every(Boolean);
}
