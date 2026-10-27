import { getCurrentProjectConfig } from "../../platform/storage/project-config";
import { getExecutionCollection } from "../requests/request-runner";
import { createFeaturePanel } from "../../platform/webviews/create-panel";
import { stopWorker } from "../requests/request-runner";
import { globalConfig, PANEL_OPTIONS } from "../../app/config";
import * as vscode from "vscode";
import { getTestingFolderData, getTestingFolderName } from "./report-storage";
import { showTabName } from "../../platform/host-utils";
import { handelFolderTestMessage } from "./folder-test-handler";
import { ApiDetailsData } from "@onapi/http-model/requests/types/api";
import { ADD_CASE_DEFAULT } from "@onapi/http-model/testing/constants/default/index";
import { cloneDeep } from "lodash";

export const createFolderTestPanel = (
  data: ApiDetailsData,
  context: vscode.ExtensionContext,
  option?: any,
) => {
  let { openedFolderTestPanels } = globalConfig;

  const folderName = getTestingFolderName(data.id, context);

  const panelOptions = PANEL_OPTIONS.FOLDER_TEST;

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
        collection: getExecutionCollection(context),
        options: {
          entrypoint: { execute: data.id, lookupStrategy: "idOrName" },
        },
        reportList: [], // Report list
        ...(getTestingFolderData(data.id, context) || {}),
      },
    });

    return;
  }

  // Create and show panel
  const panel = createFeaturePanel(context, panelOptions, {
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
