import { createFeaturePanel } from "../../platform/webviews/create-panel";
import { globalConfig, PANEL_OPTIONS } from "../../app/config";
import * as vscode from "vscode";
import { showTabName } from "../../platform/host-utils";
import { TestingReportList } from "@onapi/domain/testing/types/res/index";
import { handelFolderTestReportDataMessage } from "./folder-test-report-handler";

export const createfolderTestReportDataPanel = (
  data: TestingReportList,
  context: vscode.ExtensionContext,
) => {
  let { openedFolderTestReportDataPanels } = globalConfig;

  const panelOptions = PANEL_OPTIONS.FOLDER_TEST_REPORT;

  if (openedFolderTestReportDataPanels[data?.report_id]) {
    // Tab already exists, switch to it
    openedFolderTestReportDataPanels[data?.report_id].reveal(
      vscode.ViewColumn.One,
    );
    return;
  }

  // Create and show panel
  const panel = createFeaturePanel(context, panelOptions, {
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
