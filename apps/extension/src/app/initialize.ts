import { INIT_DEFAULT_API_DATAS } from "@onapi/http-model/requests/constants/default";
import { snowflakeId } from "@onapi/http-model/utils/data-tools";
import { cloneDeep, isArray } from "lodash";
import * as vscode from "vscode";
import { getVscodeFontFamily, getVscodeFontSize } from "../platform/host-utils";
import { getApiList, setApiList } from "../features/requests/request-storage";

export const initializePlugin = async (context: vscode.ExtensionContext) => {
  // Seed sample requests once when the global store is empty.
  let extension_config: any = context.globalState.get("extensionConfig") || {};
  const apiList = getApiList(context);
  if (
    !extension_config?.firstInit &&
    (!isArray(apiList) || apiList.length <= 0)
  ) {
    // Add sample APIs
    const initApiList = cloneDeep(INIT_DEFAULT_API_DATAS);
    let parentId = "0";
    initApiList.forEach((i) => {
      i.id = snowflakeId();
      if (i?.kind === "folder") {
        parentId = i.id;
      } else {
        i.parentId = parentId;
      }
    });
    if (!(await setApiList(initApiList as any, context))) {
      throw new Error("Failed to create sample requests");
    }
  }

  // Record first time entering the plugin
  extension_config.firstInit = true;
  context.globalState.update("extensionConfig", extension_config);

  // Get vscode font size ratio and save to system config
  let font_size = getVscodeFontSize();
  let font_family = getVscodeFontFamily();
  // Local stored data collection
  let default_system_config: any =
    context.globalState.get("systemConfig") || {};
  default_system_config.font_size = font_size;
  default_system_config.font_family = font_family;

  context.globalState.update("systemConfig", default_system_config);
};
