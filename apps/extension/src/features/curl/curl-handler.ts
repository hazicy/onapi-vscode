import * as vscode from "vscode";
import { globalConfig } from "../../app/config";
import { curlImport } from "./import-curl";

export const handelCurlMessage = async (
  message: { action: string; data: any },
  context: vscode.ExtensionContext,
) => {
  let { curlWebView } = globalConfig;
  switch (message.action) {
    case "openTabPanel":
      vscode.commands.executeCommand("openTabPanel", message.data);
      // Close import page
      curlWebView?.dispose();
      break;
    case "curlImport":
      try {
        await curlImport(message.data);
        // Close import page
        curlWebView?.dispose();
      } catch (error: any) {
        vscode.window.showErrorMessage(error);
      }
      break;
    case "getSystemConfig":
      curlWebView?.webview.postMessage({
        action: "setSystemConfig",
        data: context.globalState.get("systemConfig") || {},
      });
      break;
    case "getVscodeTheme":
      const vscodeTheme = vscode.workspace
        .getConfiguration("workbench")
        .get("colorTheme");
      curlWebView?.webview.postMessage({
        action: "setVscodeTheme",
        data: vscodeTheme,
      });
      break;
  }
};
