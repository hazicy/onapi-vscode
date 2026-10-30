import * as vscode from "vscode";
import { globalConfig } from "../../app/config";
import { saveTextFile } from "../../platform/host-utils";
import { isString } from "lodash";
import { getExportData } from "./export-data";

export const handelExportDataMessage = async (
  message: { action: string; data: any; requestId?: string },
  context: vscode.ExtensionContext,
  data: any,
) => {
  let { exportDataWebView } = globalConfig;
  switch (message.action) {
    case "getSystemConfig":
      let systemConfig: any = context.globalState.get("systemConfig") || {};
      if (isString(data?.type)) {
        systemConfig["import_data_init_type"] = data.type;
      }
      exportDataWebView?.webview.postMessage({
        action: "setSystemConfig",
        data: systemConfig,
      });
      break;
    case "exportProjectData": {
      const report = (stage: string, error?: string) =>
        exportDataWebView?.webview.postMessage({
          action: "exportStatus",
          requestId: message.requestId,
          data: { stage, ...(error ? { error } : {}) },
        });
      try {
        report("preparing");
        const exportData = await getExportData(message.data, context);
        if (!exportData.fileName) {
          throw new Error("Unsupported export format");
        }
        report("choosingLocation");
        const savedPath = await saveTextFile(
          exportData.fileName,
          exportData.fileText,
          () => report("saving"),
        );
        if (!savedPath) {
          report("cancelled");
          break;
        }
        report("complete");
        vscode.window.showInformationMessage(
          "Export Successful！🎉: " + savedPath,
        );
        exportDataWebView?.dispose();
      } catch (error) {
        report("error", error instanceof Error ? error.message : String(error));
      }
      break;
    }
    case "getVscodeTheme":
      const vscodeTheme = vscode.workspace
        .getConfiguration("workbench")
        .get("colorTheme");
      exportDataWebView?.webview.postMessage({
        action: "setVscodeTheme",
        data: vscodeTheme,
      });
      break;
  }
};
