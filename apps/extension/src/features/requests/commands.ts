import { syncRequestDocument } from "./request-editor";
import { postRequestPanelResponse } from "../../platform/webviews/request-panel-channel";
import * as vscode from "vscode";
import { copyTextToClipboard, showTabName } from "../../platform/host-utils";
import { getResolvedCodeRequest } from "./execution/http-runner";
import type { ApiDetailsData } from "@onapi/domain/requests/types/api";
export {
  sendApi,
  sendAutoTest,
  stopWorker,
  getCodeHarRequest,
} from "./execution/http-runner";

export const updateOpenData = (
  openedPanels: { [key: string]: vscode.WebviewPanel },
  apiData: ApiDetailsData,
) => {
  const panel = openedPanels?.[apiData?.id];
  if (panel && syncRequestDocument(panel, apiData)) {
    return;
  }
  if (["api", "folder"].includes(apiData?.kind) && panel) {
    // Update title
    panel.title = showTabName(apiData?.name);
    // Update content
    postRequestPanelResponse(panel.webview, {
      action: "setApiData",
      data: apiData,
    });
  }
};

export const copyAsCurl = async (
  apiData: ApiDetailsData,
  context: vscode.ExtensionContext,
) => {
  try {
    const { generateRequestCode } = await import("./code-generation");
    const request = await getResolvedCodeRequest(apiData, context);
    copyTextToClipboard(await generateRequestCode(request, "curl", "cURL"));
  } catch (error) {
    vscode.window.showErrorMessage(String(error));
  }
};
