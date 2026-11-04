import { createFeaturePanel } from "../../platform/webviews/create-panel";
import { globalConfig, PANEL_OPTIONS } from "../../app/config";
import * as vscode from "vscode";
import { getApiList } from "../requests/request-storage";
import { handelImportDataMessage } from "./import-data-handler";
import { collectImportSource, type ImportPreview } from "./import-source";
import { getCurrentProjectId } from "../../platform/storage/project-config";
import i18next from "i18next";

export const createImportDataPanel = (
  data: { type?: string } | undefined,
  context: vscode.ExtensionContext,
) =>
  collectImportSource(data, context, (preview) =>
    openImportPreview(preview, context),
  );

const openImportPreview = (
  data: ImportPreview,
  context: vscode.ExtensionContext,
) => {
  let { importDataWebView } = globalConfig;

  const panelOptions = PANEL_OPTIONS.IMPORTDATA;

  if (importDataWebView) {
    importDataWebView.dispose();
  }
  // Create and show panel
  const panel = createFeaturePanel(context, panelOptions, {
    data: { importPreview: data },
  });

  // Receive messages from Webview
  panel.webview.onDidReceiveMessage(
    async (message: { action: string; data: any; requestId?: string }) => {
      if (message.action === "closeImportPreview") {
        panel.dispose();
        return;
      }
      if (data.projectId !== getCurrentProjectId(context)) {
        panel.webview.postMessage({
          action: "importError",
          requestId: message.requestId,
          data: i18next.t("importSource.workspaceChanged"),
        });
        return;
      }
      await handelImportDataMessage(message, context, data);
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
