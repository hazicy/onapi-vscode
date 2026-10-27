import { getExecutionCollection } from "../requests/execution/http-runner";
import { relayExecutionEvent } from "../../platform/execution/webview-relay";
import * as vscode from "vscode";
import { runCollection, stopWorker } from "../requests/execution/http-runner";
import { getCurrentProjectConfig } from "../../platform/storage/project-config";
import { getApiListName } from "../requests/request-storage";
import { getTestingFolderData, setTestingFolderData } from "./report-storage";
import type { ApiDetailsData } from "@onapi/domain/requests/types/api";

export async function handelFolderTestMessage(
  message: { action: string; data: any },
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
  folder: ApiDetailsData,
  openHistoryReport: boolean,
) {
  const saved = getTestingFolderData(folder.id, context) || {};
  switch (message.action) {
    case "getTestData":
    case "refreshEventList":
      panel.webview.postMessage({
        action: "setTestData",
        data: {
          name: folder.name,
          collection: getExecutionCollection(context),
          options: {
            ...saved.options,
            entrypoint: {
              execute: folder.id,
              lookupStrategy: "idOrName",
            },
          },
          reportList: saved.reportList || [],
          showReportList: openHistoryReport,
        },
      });
      break;
    case "runPostmanCollection": {
      const workspace = getApiListName(context);
      const events: any[] = [];
      const startedAt = Date.now();
      try {
        await runCollection(
          message.data.collection,
          message.data.options,
          context,
          (event) => {
            if ("native" in event.event) {
              events.push(event.event.native);
            }
            relayExecutionEvent(panel.webview, event);
          },
          panel,
        );
        if (getApiListName(context) !== workspace) {
          return;
        }
        const latest = getTestingFolderData(folder.id, context) || {};
        const report = {
          report_id: crypto.randomUUID(),
          report_name: folder.name,
          startedAt,
          finishedAt: Date.now(),
          events,
        };
        const reportList = [report, ...(latest.reportList || [])];
        const persisted = await setTestingFolderData(
          folder.id,
          { ...latest, options: message.data.options, reportList },
          context,
        );
        if (!persisted) {
          throw new Error("Failed to save test report");
        }
        panel.webview.postMessage({
          action: "postmanReports",
          data: reportList,
        });
      } catch (error: any) {
        console.error(error); // The execution service already published the failure.
      }
      break;
    }
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
