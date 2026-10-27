import type { RequestPanelMessage } from "./panel-message";
import { createFeaturePanel } from "../../platform/webviews/create-panel";
import { stopWorker } from "./execution/http-runner";
import { disconnectWebSocketSession } from "./execution/websocket-session";
import { disconnectSocketIoSession } from "./execution/socketio-session";
import { setRequestDraft } from "./request-status";
import { getApiListName } from "./request-storage";
import { getProtocolIcon } from "../sidebar/protocol-icon";
import { globalConfig, PANEL_OPTIONS } from "../../app/config";
import * as vscode from "vscode";
import path from "path";
import { getApiList } from "./request-storage";
import { getCurrentProjectConfig } from "../../platform/storage/project-config";
import { showTabName } from "../../platform/host-utils";
import { handelOpenMessage } from "./open-handler";
import { getDocBaseUrl } from "../sharing/share-data";

export const createOpenPanel = (
  data: any,
  context: vscode.ExtensionContext,
  openHandledAt = Date.now(),
) => {
  const panelStartedAt = Date.now();
  const { openedPanels } = globalConfig;

  const statusWorkspace = getApiListName(context);
  const panelOptions = PANEL_OPTIONS.OPEN;

  if (openedPanels[data?.id]) {
    // Tab already exists, switch to it
    const protocolIcon = getProtocolIcon(context, data);
    if (protocolIcon) {
      openedPanels[data?.id].iconPath = protocolIcon;
    }
    openedPanels[data?.id].reveal(vscode.ViewColumn.One);
    return;
  }
  const afterText = !getApiList(context).some((item) => item.id === data?.id)
    ? " ⚈"
    : "";
  // Create and show panel
  const panel = createFeaturePanel(context, panelOptions, {
    title: showTabName(data?.name || panelOptions.title) + afterText,
    hydrate: true,
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

  openedPanels[data?.id] = panel;

  // Receive messages from Webview
  panel.webview.onDidReceiveMessage(async (message: RequestPanelMessage) => {
    handelOpenMessage(message, context, panel, data);
  });

  // Listen for Webview view visibility changes
  panel.onDidChangeViewState(() => {
    if (panel.visible) {
      // Get latest directory list
      panel?.webview.postMessage({
        action: "setApiList",
        data: getApiList(context),
      });

      // Get latest project data
      panel?.webview.postMessage({
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
      setRequestDraft(statusWorkspace, data.id);
      delete openedPanels[data?.id];
      disconnectWebSocketSession(data.id);
      disconnectSocketIoSession(data.id);
    },
    null,
    context.subscriptions,
  );
};
