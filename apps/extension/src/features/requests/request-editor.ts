import type { RequestDocument } from "./request-document";
import type { ApiDetailsData } from "@onapi/domain/requests/types/api";
import { getDataFromGlobalStorage } from "../../platform/storage";
import { setRequestDraft } from "./request-status";
import { openCustomEditor } from "../../platform/webviews/custom-editor";
import { postRequestPanelResponse } from "../../platform/webviews/request-panel-channel";
import { receiveRequestPanelCommand } from "../../platform/webviews/request-panel-channel";
import { setupFeatureWebview } from "../../platform/webviews/create-panel";
import { stopWorker } from "./execution/http-runner";
import { disconnectWebSocketSession } from "./execution/websocket-session";
import { disconnectSocketIoSession } from "./execution/socketio-session";
import { getApiListName } from "./request-storage";
import { getProtocolIcon } from "../sidebar/protocol-icon";
import { globalConfig, PANEL_OPTIONS } from "../../app/config";
import * as vscode from "vscode";
import path from "path";
import { getApiList } from "./request-storage";
import { getCurrentProjectConfig } from "../../platform/storage/project-config";
import { showTabName } from "../../platform/host-utils";
import { handleRequestPanelCommand } from "./request-panel-handler";

import { getDocBaseUrl } from "../sharing/share-data";

export const openRequestEditor = (
  data: ApiDetailsData,
  context: vscode.ExtensionContext,
  openHandledAt = Date.now(),
) => {
  const { openedPanels } = globalConfig;

  if (openedPanels[data?.id]) {
    // Tab already exists, switch to it
    const protocolIcon = getProtocolIcon(context, data);
    if (protocolIcon) {
      openedPanels[data?.id].iconPath = protocolIcon;
    }
    openedPanels[data?.id].reveal(vscode.ViewColumn.One);
    return;
  }
  return openCustomEditor(context, "onapi.request", data.id, {
    workspace: getApiListName(context),
    data: getApiList(context).some((item) => item.id === data.id)
      ? { id: data.id }
      : data,
    option: openHandledAt,
  });
};

export const resolveRequestEditor = (
  document: RequestDocument,
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
  openHandledAt = Date.now(),
  resourceKey = document.draft.id,
) => {
  const data = document.draft;
  bindRequestDocument(document, panel);
  const panelStartedAt = Date.now();
  const { openedPanels } = globalConfig;

  const panelOptions = PANEL_OPTIONS.OPEN;

  // Create and show panel
  setupFeatureWebview(context, panel, panelOptions, {
    title: showTabName(data?.name || panelOptions.title),
    data: {
      startupTiming: { panelStartedAt, openHandledAt },
      kind: data?.kind,
      initialData: {
        apiData: data,
        projectConfig: getCurrentProjectConfig(context),
        systemConfig: context.globalState.get("systemConfig") || {},
        vscodeTheme: vscode.workspace
          .getConfiguration("workbench")
          .get("colorTheme"),
        docBaseUrl: getDocBaseUrl(context),
      },
    },
  });
  const iconName = panelOptions?.iconObj?.[data?.kind] || "";
  panel.iconPath =
    getProtocolIcon(context, data) ??
    vscode.Uri.file(
      path.join(context.extensionPath, "dist", "images", iconName),
    );

  openedPanels[resourceKey] = panel;

  // Receive messages from Webview
  panel.webview.onDidReceiveMessage(async (message: unknown) => {
    await receiveRequestPanelCommand(
      message,
      (validated) =>
        handleRequestPanelCommand(validated, context, panel, document),
      async (error) => {
        const source =
          message && typeof message === "object"
            ? (message as Record<string, unknown>)
            : {};
        try {
          await postRequestPanelResponse(panel.webview, {
            action: "requestPanelError",
            ...(typeof source.requestId === "string" && source.requestId.trim()
              ? { requestId: source.requestId }
              : {}),
            data: {
              targetId: data.id,
              action:
                typeof source.action === "string" ? source.action : undefined,
              executionId:
                typeof source.executionId === "string" &&
                source.executionId.trim()
                  ? source.executionId
                  : undefined,
              error: { message: error.message },
            },
          });
        } catch (deliveryError) {
          console.error("Failed to deliver request panel error", deliveryError);
        }
        await vscode.window.showErrorMessage(error.message);
      },
    );
  });

  // Listen for Webview view visibility changes
  panel.onDidChangeViewState(() => {
    if (panel.visible) {
      // Get latest directory list
      postRequestPanelResponse(panel.webview, {
        action: "setApiList",
        data: getApiList(context),
      });

      // Get latest project data
      postRequestPanelResponse(panel.webview, {
        action: "setProjectConfig",
        data: getCurrentProjectConfig(context),
      });
    }
  });

  // Triggered when tab is closed
  panel.onDidDispose(
    () => {
      // When the panel is closed, cancel any future updates to the webview content
      stopWorker(panel);
      if (openedPanels[resourceKey] === panel) {
        delete openedPanels[resourceKey];
      }
      disconnectWebSocketSession(data.id);
      disconnectSocketIoSession(data.id);
    },
    null,
    context.subscriptions,
  );
};

const panels = new WeakMap<vscode.WebviewPanel, RequestDocument>();
const documents = new Set<RequestDocument>();

/** Presentation is a subscriber; the model never owns a Webview. */
export function bindRequestDocument(
  document: RequestDocument,
  panel: vscode.WebviewPanel,
) {
  documents.add(document);
  panels.set(panel, document);
  const publish = () => {
    if (document.uri.scheme === "onapi-editor") {
      setRequestDraft(
        document.workspace,
        document.draft.id,
        document.dirty ? document.draft : undefined,
      );
    }
    panel.title = showTabName(document.draft.name || PANEL_OPTIONS.OPEN.title);
    const icon = getProtocolIcon(document.context, document.draft);
    if (icon) {
      panel.iconPath = icon;
    }
  };
  const send = (message: Parameters<typeof postRequestPanelResponse>[1]) => {
    try {
      void Promise.resolve(
        postRequestPanelResponse(panel.webview, message),
      ).catch((error) =>
        console.error("Failed to update request editor", error),
      );
    } catch (error) {
      console.error("Failed to update request editor", error);
    }
  };
  const subscription = document.onDidChange((event) => {
    if (event.type === "dispose") {
      documents.delete(document);
      panels.delete(panel);
      if (document.uri.scheme === "onapi-editor") {
        setRequestDraft(document.workspace, document.draft.id);
      }
      subscription.dispose();
      return;
    }
    publish();
    if (event.type === "replace") {
      send({ action: "setApiData", data: document.draft });
    }
    if (event.type === "save") {
      send({
        action: "requestSaved",
        data: { definition: event.definition, submitted: event.submitted },
      });
    }
  });
  panel.onDidDispose(() => {
    subscription.dispose();
    panels.delete(panel);
    documents.delete(document);
    if (document.uri.scheme === "onapi-editor") {
      setRequestDraft(document.workspace, document.draft.id);
    }
  });
  publish();
}

export function discardRequestDocuments(
  workspace: string,
  ids: Iterable<string>,
) {
  const deleted = new Set(ids);
  for (const document of documents) {
    if (
      document.uri.scheme === "onapi-editor" &&
      document.workspace === workspace &&
      deleted.has(document.draft.id)
    ) {
      document.markDeleted();
    }
  }
}

export function syncRequestDocument(
  panel: vscode.WebviewPanel,
  data: ApiDetailsData,
) {
  const document = panels.get(panel);
  if (!document) {
    return false;
  }
  document.acceptStored(data);
  return true;
}

export function syncRequestDocuments(context: vscode.ExtensionContext) {
  const workspaces = new Map<string, ApiDetailsData[]>();
  for (const document of documents) {
    if (
      document.context !== context ||
      document.uri.scheme !== "onapi-editor" ||
      document.dirty
    ) {
      continue;
    }
    let rows = workspaces.get(document.workspace);
    if (!rows) {
      rows = getDataFromGlobalStorage(context, document.workspace, []);
      workspaces.set(document.workspace, rows!);
    }
    const saved = rows!.find((item) => item.id === document.draft.id);
    if (saved) {
      document.acceptStored(saved);
    }
  }
}
