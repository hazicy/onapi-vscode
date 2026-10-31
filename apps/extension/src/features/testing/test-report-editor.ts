import { getApiListName } from "../requests/request-storage";
import { openCustomEditor } from "../../platform/webviews/custom-editor";
import { setupFeatureWebview } from "../../platform/webviews/create-panel";
import { globalConfig, PANEL_OPTIONS } from "../../app/config";
import * as vscode from "vscode";
import { showTabName } from "../../platform/host-utils";
import type { TestingReportList } from "@onapi/contracts";
import { handelFolderTestReportDataMessage } from "./folder-test-report-handler";

export const openTestReportEditor = (
  data: TestingReportList,
  context: vscode.ExtensionContext,
) => {
  let { openedFolderTestReportDataPanels } = globalConfig;

  if (openedFolderTestReportDataPanels[data?.report_id]) {
    // Tab already exists, switch to it
    openedFolderTestReportDataPanels[data?.report_id].reveal(
      vscode.ViewColumn.One,
    );
    return;
  }

  return openCustomEditor(context, "onapi.testReport", data.report_id, {
    workspace: getApiListName(context),
    data: { report_id: data.report_id },
  });
};

export const resolveTestReportEditor = (
  data: TestingReportList,
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
) => {
  let { openedFolderTestReportDataPanels } = globalConfig;

  const panelOptions = PANEL_OPTIONS.FOLDER_TEST_REPORT;

  // Create and show panel
  setupFeatureWebview(context, panel, panelOptions, {
    title: showTabName(data?.report_name || panelOptions.title),
  });

  // Receive messages from Webview
  panel.webview.onDidReceiveMessage(
    async (message: { action: string; data: any }) => {
      handelFolderTestReportDataMessage(message, context, data, panel);
    },
  );

  // Triggered when tab is closed
  panel.onDidDispose(
    () => {
      delete openedFolderTestReportDataPanels[data?.report_id];
      // When the panel is closed, cancel any future updates to the webview content
    },
    null,
    context.subscriptions,
  );
  // Store tab in list
  openedFolderTestReportDataPanels[data?.report_id] = panel;
};
