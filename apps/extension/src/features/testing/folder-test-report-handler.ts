import * as vscode from "vscode";
import { getCurrentProjectConfig } from "../../platform/storage/project-config";

export const handelFolderTestReportDataMessage = (
  message: { action: string; data: any },
  context: vscode.ExtensionContext,
  reportDetails: any,
  panel: vscode.WebviewPanel,
) => {
  switch (message.action) {
    case "openEnv":
      vscode.commands.executeCommand("onapi.openEnv", message.data);
      break;
    case "openNewWindow":
      vscode.env.openExternal(vscode.Uri.parse(message.data));
      break;
    case "getReportDetails":
      panel.webview.postMessage({
        action: "setReportDetails",
        data: reportDetails,
      });
      break;
    case "getSystemConfig":
      panel?.webview.postMessage({
        action: "setSystemConfig",
        data: context.globalState.get("systemConfig") || {},
      });
      break;
    case "getProjectConfig":
      let project_config = getCurrentProjectConfig(context);
      panel.webview.postMessage({
        action: "setProjectConfig",
        data: project_config,
      });
      break;
  }
};
