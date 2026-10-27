import * as vscode from "vscode";
import { cloneDeep, forEach, isString, map } from "lodash";
import Har2languages from "har2languages";
import { copyTextToClipboard, showTabName } from "../../platform/host-utils";
import { getCodeHarRequest } from "./execution/http-runner";
import type { ApiDetailsData } from "@onapi/http-model/requests/types/api";
import type { ProjectConfigType } from "@onapi/http-model/project/types/index";
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
    const codeHar: any = await getCodeHarRequest(apiData, context);
    if (isString(codeHar)) {
      vscode.window.showErrorMessage(`${codeHar}`);
      return;
    }
    const request = cloneDeep(codeHar)?.log?.entries?.[0]?.request;
    request.url = request?.url?.split("#")[0];
    request.headers = map(request?.headers, (it) => {
      if (!isString(it.value)) {
        return { ...it, value: String(it.value) };
      }
      return it;
    });
    const har2languages = new Har2languages();
    const languagesRes: any = har2languages.convert(request, "shell", "curl");

    if (languagesRes?.status === "error") {
      vscode.window.showInformationMessage(`${languagesRes?.message}`);
      return;
    }
    try {
      languagesRes.data = decodeURIComponent(languagesRes?.data);
      copyTextToClipboard(languagesRes.data || "");
    } catch (error) {}
  } catch (error) {}
};
