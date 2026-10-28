import { ApiDetailsData } from "@onapi/domain/requests/types/api";
import * as vscode from "vscode";
import {
  getDataFromGlobalStorage,
  setDataToGlobalStorage,
  updateDataInGlobalStorage,
} from "../../platform/storage/index";
export const getApiList = (
  context: vscode.ExtensionContext,
): ApiDetailsData[] => {
  return getDataFromGlobalStorage(context, getApiListName(context), []);
};

export const setApiList = (
  items: ApiDetailsData[],
  context: vscode.ExtensionContext,
) => setDataToGlobalStorage(context, getApiListName(context), items);

export const updateApiList = (
  context: vscode.ExtensionContext,
  change: (items: ApiDetailsData[]) => ApiDetailsData[],
) => updateDataInGlobalStorage(context, getApiListName(context), change);

export const getApiListName = (context: vscode.ExtensionContext) => {
  try {
    let user_config: any = context.globalState.get("userConfig") || {};
    let apiListName = "apiList";
    if (
      user_config?.currentProject &&
      user_config?.currentProject?.project_id !== "-1"
    ) {
      apiListName = apiListName + `:${user_config.currentProject.project_id}`;
    } else {
    }
    return apiListName;
  } catch (error) {
    return "apiList";
  }
};
