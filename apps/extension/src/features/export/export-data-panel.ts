import { createFeaturePanel } from "../../platform/webviews/create-panel";
import { globalConfig } from "../../app/config";
import * as vscode from "vscode";
import { handelExportDataMessage } from "./export-data-handler";
import { isString } from "lodash";
import { PANEL_OPTIONS } from "../../app/config";

export const createExportDataPanel = (
  data: any,
  context: vscode.ExtensionContext,
) => {
  let { exportDataWebView } = globalConfig;
  if (exportDataWebView) {
    let systemConfig: any = context.globalState.get("systemConfig") || {};
    if (isString(data?.type)) {
      systemConfig["import_data_init_type"] = data.type;
    }
    exportDataWebView?.webview.postMessage({
      action: "setSystemConfig",
      data: systemConfig,
    });

    // Tab already exists, switch to it
    exportDataWebView.reveal(vscode.ViewColumn.One);
    return;
  }
  const panelOptions = PANEL_OPTIONS.EXPORTDATA;
  // Create and show panel
  const panel = createFeaturePanel(context, panelOptions);

  // Receive messages from Webview
  panel.webview.onDidReceiveMessage(
    async (message: { action: string; data: any }) => {
      handelExportDataMessage(message, context, data);
    },
  );

  // Listen for Webview view visibility changes
  panel.onDidChangeViewState(() => {
    if (panel.visible) {
      // Get latest API list
      // panel.webview.postMessage({ action: 'setApiList', data: getApiList(context) || [] });
    }
  });

  // Triggered when tab is closed
  panel.onDidDispose(
    () => {
      globalConfig.exportDataWebView = null;
      // When the panel is closed, cancel any future updates to the webview content
    },
    null,
    context.subscriptions,
  );
  globalConfig.exportDataWebView = panel;
};
