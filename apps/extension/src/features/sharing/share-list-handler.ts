import { handlePanelAction } from "../../platform/webviews/panel-actions";
import * as vscode from "vscode";
import { globalConfig } from "../../app/config";

import {
  batchDeleteShare,
  deleteShare,
  getProjectShareData,
} from "./share-data";

export const handelPushMessage = async (
  message: { action: string; data: any },
  context: vscode.ExtensionContext,
) => {
  const { shareListWebView } = globalConfig;

  if (await handlePanelAction(message, context, shareListWebView)) {
    return;
  }

  switch (message.action) {
    case "getShareData":
      shareListWebView?.webview.postMessage({
        action: "setShareData",
        data: getProjectShareData(context),
      });
      break;

    case "deleteShare":
      deleteShare(message.data, context);

      // Refresh share list
      shareListWebView?.webview.postMessage({
        action: "setShareData",
        data: getProjectShareData(context),
      });
      break;
    case "batchDeleteShare":
      batchDeleteShare(message.data, context);

      // Refresh share list
      shareListWebView?.webview.postMessage({
        action: "setShareData",
        data: getProjectShareData(context),
      });
      break;
  }
};
