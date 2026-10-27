import { createFeaturePanel } from "../../platform/webviews/create-panel";
import { globalConfig } from "../../app/config";
import * as vscode from "vscode";
import { handelCurlMessage } from "./curl-handler";

export const createCurlPanel = (
  data: any,
  context: vscode.ExtensionContext,
) => {
  let { curlWebView } = globalConfig;

  if (curlWebView) {
    // Tab already exists, switch to it
    curlWebView.reveal(vscode.ViewColumn.One);
    return;
  }
  // Create and show panel
  const panel = createFeaturePanel(context, {
    viewType: "curlPanel",
    title: "cURL",
    iconName: "curl.png",
  });

  // Receive messages from Webview
  panel.webview.onDidReceiveMessage(
    async (message: { action: string; data: any }) => {
      handelCurlMessage(message, context);
    },
  );

  // Listen for Webview view visibility changes
  panel.onDidChangeViewState(() => {
    if (panel.visible) {
    }
  });

  // Triggered when tab is closed
  panel.onDidDispose(
    () => {
      globalConfig.curlWebView = null;
      // When the panel is closed, cancel any future updates to the webview content
    },
    null,
    context.subscriptions,
  );
  globalConfig.curlWebView = panel;
};
