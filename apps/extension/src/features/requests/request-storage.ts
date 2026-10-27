import { ApiDetailsData } from "@onapi/domain/requests/types/api";
import { cloneDeep, forEach, isArray, isNumber } from "lodash";
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

export const setProjectApisVersion = async (
  context: vscode.ExtensionContext,
  apis: Pick<ApiDetailsData, "project_id" | "id" | "version">[],
) => {
  try {
    const project_apis_version: any = cloneDeep(
      context.globalState.get("projectApisVersion") || {},
    );
    if (isArray(apis)) {
      forEach(apis, (item) => {
        if (
          item?.id &&
          item?.project_id &&
          item.project_id !== "-1" &&
          isNumber(item?.version)
        ) {
          if (!project_apis_version?.[item.project_id]) {
            project_apis_version[item.project_id] = {};
          }
          project_apis_version[item.project_id][item.id] = item.version;
        }
      });
    }
    await context.globalState.update(
      "projectApisVersion",
      project_apis_version,
    );
    return true;
  } catch {
    return false;
  }
};

export const getProjectApisVersion = (context: vscode.ExtensionContext) => {
  try {
    let user_config: any = context.globalState.get("userConfig") || {};
    let project_apis_version: any =
      context.globalState.get("projectApisVersion") || {};

    if (
      user_config?.currentProject &&
      user_config?.currentProject?.project_id !== "-1"
    ) {
      return (
        project_apis_version?.[user_config.currentProject.project_id] || {}
      );
    } else {
      return {};
    }
  } catch (error) {}
  return {};
};
