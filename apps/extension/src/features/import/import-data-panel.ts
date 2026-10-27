import { createFeaturePanel } from "../../platform/webviews/create-panel";
import { globalConfig, PANEL_OPTIONS } from "../../app/config";
import * as vscode from "vscode";
import { getApiList } from "../requests/request-storage";
import { handelImportDataMessage } from "./import-data-handler";
import { isString } from "lodash";

export const createImportDataPanel = (
  data: any,
  context: vscode.ExtensionContext,
) => {
  let { importDataWebView } = globalConfig;

  const panelOptions = PANEL_OPTIONS.IMPORTDATA;

  if (importDataWebView) {
    let systemConfig: any = context.globalState.get("systemConfig") || {};
    if (isString(data?.type)) {
      systemConfig["import_data_init_type"] = data.type;
    }
    importDataWebView?.webview.postMessage({
      action: "setSystemConfig",
      data: systemConfig,
    });

    // Tab already exists, switch to it
    importDataWebView.reveal(vscode.ViewColumn.One);
    return;
  }
  // Create and show panel
  const panel = createFeaturePanel(context, panelOptions);

  // Receive messages from Webview
  panel.webview.onDidReceiveMessage(
    async (message: { action: string; data: any }) => {
      handelImportDataMessage(message, context, data);
    },
  );

  // Listen for Webview view visibility changes
  panel.onDidChangeViewState(() => {
    if (panel.visible) {
      // Get latest API list
      panel.webview.postMessage({
        action: "setApiList",
        data: getApiList(context) || [],
      });
    }
  });

  // Triggered when tab is closed
  panel.onDidDispose(
    () => {
      globalConfig.importDataWebView = null;
      // When the panel is closed, cancel any future updates to the webview content
    },
    null,
    context.subscriptions,
  );
  globalConfig.importDataWebView = panel;
};
