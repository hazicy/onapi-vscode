import { getApiListName } from "../requests/request-storage";
import { openCustomEditor } from "../../platform/webviews/custom-editor";
import { getCurrentProjectConfig } from "../../platform/storage/project-config";
import { setupFeatureWebview } from "../../platform/webviews/create-panel";
import { stopWorker } from "../requests/execution/http-runner";
import { globalConfig, PANEL_OPTIONS } from "../../app/config";
import * as vscode from "vscode";
import { getFolderTestPageData } from "./folder-test-data";
import { getTestingFolderName } from "./report-storage";
import { showTabName } from "../../platform/host-utils";
import { handelFolderTestMessage } from "./folder-test-handler";
import { ApiDetailsData } from "@onapi/domain/requests/types/api";

export const openFolderTestEditor = (
  data: ApiDetailsData,
  context: vscode.ExtensionContext,
  option?: any,
) => {
  let { openedFolderTestPanels } = globalConfig;

  const folderName = getTestingFolderName(data.id, context);

  // Whether to open report page
  const openHistoryReport = option?.openHistoryReport || false;

  if (openedFolderTestPanels[folderName]) {
    // Tab already exists, switch to it
    openedFolderTestPanels[folderName].reveal(vscode.ViewColumn.One);

    // Return to initial state
    openedFolderTestPanels[folderName].webview.postMessage({
      action: "setTestData",
      data: {
        isInit: true,
        showReportList: openHistoryReport,
        testingName: data.name, // Test name
        ...getFolderTestPageData(data.id, context),
      },
    });

    return;
  }

  return openCustomEditor(context, "onapi.folderTest", folderName, {
    workspace: getApiListName(context),
    data: { id: data.id },
    option,
  });
};

export const resolveFolderTestEditor = (
  data: ApiDetailsData,
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
  option?: any,
) => {
  let { openedFolderTestPanels } = globalConfig;

  const folderName = getTestingFolderName(data.id, context);

  const panelOptions = PANEL_OPTIONS.FOLDER_TEST;

  // Whether to open report page
  const openHistoryReport = option?.openHistoryReport || false;

  // Create and show panel
  setupFeatureWebview(context, panel, panelOptions, {
    title: showTabName(data?.name || panelOptions.title),
  });

  // Receive messages from Webview
  panel.webview.onDidReceiveMessage(
    async (message: { action: string; data: any }) => {
      handelFolderTestMessage(message, context, panel, data, openHistoryReport);
    },
  );

  // Listen for Webview view visibility changes
  panel.onDidChangeViewState(() => {
    if (panel.visible) {
      // Pass environment info to page after display
      panel.webview.postMessage({
        action: "setProjectConfig",
        data: getCurrentProjectConfig(context),
      });
    }
  });

  // Triggered when tab is closed
  panel.onDidDispose(
    () => {
      stopWorker(panel);
      delete openedFolderTestPanels[folderName];
      // When the panel is closed, cancel any future updates to the webview content
    },
    null,
    context.subscriptions,
  );
  // Store tab in list
  openedFolderTestPanels[folderName] = panel;
};
