import * as vscode from "vscode";
import { forEach } from "lodash";
import { generateRequestCode } from "./code-generation";
import { copyTextToClipboard, showTabName } from "../../platform/host-utils";
import { getResolvedCodeRequest } from "./execution/http-runner";
import type { ApiDetailsData } from "@onapi/domain/requests/types/api";
import type { ProjectConfigType } from "@onapi/domain/project/types/index";
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
  if (["api", "folder"].includes(apiData?.kind) && panel) {
    // Update title
    panel.title = showTabName(apiData?.name);
    // Update content
    panel.webview.postMessage({ action: "setApiData", data: apiData });
  }
};

export const updateOpenProjectConfig = (
  openedPanels: { [key: string]: vscode.WebviewPanel },
  projectConfig: ProjectConfigType,
) => {
  forEach(openedPanels, (openedPanel) => {
    openedPanel.webview.postMessage({
      action: "setProjectConfig",
      data: projectConfig,
    });
  });
};

export const copyAsCurl = async (
  apiData: ApiDetailsData,
  context: vscode.ExtensionContext,
) => {
  try {
    const request = await getResolvedCodeRequest(apiData, context);
    copyTextToClipboard(await generateRequestCode(request, "curl", "cURL"));
  } catch (error) {
    vscode.window.showErrorMessage(String(error));
  }
};
