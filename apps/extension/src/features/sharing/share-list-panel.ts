import { createFeaturePanel } from "../../platform/webviews/create-panel";
import { globalConfig, PANEL_OPTIONS } from "../../app/config";
import * as vscode from "vscode";
import { getApiList } from "../requests/request-storage";
import { handelPushMessage } from "./share-list-handler";
import { getProjectShareData } from "./share-data";

export const createShareListPanel = (
  data: any,
  context: vscode.ExtensionContext,
) => {
  let { shareListWebView } = globalConfig;

  const panelOptions = PANEL_OPTIONS.SHARELIST;

  if (shareListWebView) {
    // Tab already exists, switch to it
    shareListWebView.reveal(vscode.ViewColumn.One);
    return;
  }
  // Create and show panel
  const panel = createFeaturePanel(context, panelOptions);

  // Receive messages from Webview
  panel.webview.onDidReceiveMessage(
    async (message: { action: string; data: any }) => {
      handelPushMessage(message, context);
    },
  );

  // Listen for Webview view visibility changes
  panel.onDidChangeViewState(() => {
    if (panel.visible) {
      // Pass latest data to view after display
      panel?.webview.postMessage({
        action: "setApiList",
        data: getApiList(context),
      });
      panel?.webview.postMessage({
        action: "setShareData",
        data: getProjectShareData(context),
      });
    }
  });

  // Triggered when tab is closed
  panel.onDidDispose(
    () => {
      globalConfig.shareListWebView = null;
      // When the panel is closed, cancel any future updates to the webview content
    },
    null,
    context.subscriptions,
  );
  globalConfig.shareListWebView = panel;
};
