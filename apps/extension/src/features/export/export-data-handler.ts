import * as vscode from "vscode";
import { globalConfig } from "../../app/config";
import { downloadFile } from "../../platform/host-utils";
import { isString } from "lodash";
import { getExportData } from "./export-data";

export const handelExportDataMessage = async (
  message: { action: string; data: any },
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
    case "exportProjectData":
      try {
        const exportData = await getExportData(message.data, context);
        if (exportData.fileName.length > 0) {
          const downLoadSuccess = await downloadFile(
            exportData.fileName,
            exportData.fileText,
          );
          downLoadSuccess && exportDataWebView?.dispose();
        }
      } catch (error) {}
      break;
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
