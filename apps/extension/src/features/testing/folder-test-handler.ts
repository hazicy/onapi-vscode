import * as vscode from "vscode";
import { stopWorker } from "../requests/execution/http-runner";
import { getCurrentProjectConfig } from "../../platform/storage/project-config";
import { getFolderTestPageData } from "./folder-test-data";
import { runFolderTest } from "./folder-test-runner";
import { setTestingFolderData } from "./report-storage";
import type { ApiDetailsData } from "@onapi/domain/requests/types/api";

export async function handelFolderTestMessage(
  message: { action: string; data: any },
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
  folder: ApiDetailsData,
  openHistoryReport: boolean,
) {
  switch (message.action) {
    case "getTestData":
    case "refreshEventList":
      panel.webview.postMessage({
        action: "setTestData",
        data: {
          testingName: folder.name || "Test Folder",
          isInit: message.action === "getTestData",
          ...getFolderTestPageData(folder.id, context),
          showReportList: openHistoryReport,
        },
      });
      break;
    case "saveFolderTestData":
      await setTestingFolderData(
        folder.id,
        {
          ...(message.data.config ? { config: message.data.config } : {}),
          ...(Array.isArray(message.data.reportList)
            ? { reportList: message.data.reportList }
            : {}),
        },
        context,
      );
      break;
    case "sendEventList":
      await runFolderTest(folder.id, message.data, context, panel);
      break;
    case "stopSendEventList":
      stopWorker(panel);
      break;
    case "getProjectConfig":
      panel.webview.postMessage({
        action: "setProjectConfig",
        data: getCurrentProjectConfig(context),
      });
      break;
    case "getSystemConfig":
      panel.webview.postMessage({
        action: "setSystemConfig",
        data: context.globalState.get("systemConfig") || {},
      });
      break;
    case "getVscodeTheme":
      panel.webview.postMessage({
        action: "setVscodeTheme",
        data: vscode.workspace.getConfiguration("workbench").get("colorTheme"),
      });
      break;
    case "openEnv":
      vscode.commands.executeCommand("onapi.openEnv", message.data);
      break;
  }
}
