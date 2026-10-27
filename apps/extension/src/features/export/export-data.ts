import * as vscode from "vscode";
import { createDefaultHttpConfig } from "@onapi/domain";
import { getApiList } from "../requests/request-storage";
import { getCurrentProjectConfig } from "../../platform/storage/project-config";
import { getUserConfig } from "../../app/user-config";
import { EXPORT_TYPE_ENUM } from "@onapi/domain/settings/constants/settings";
import { exportMethod } from "@onapi/api-converter/export";
import { showConverterWarnings } from "../import/converter-warnings";
import { getExportData as getExportApiData } from "../sharing/share-data";

export const getExportData = async (
  option: { type: string; version: string },
  context: vscode.ExtensionContext,
) => {
  const result = {
    fileName: "",
    fileText: "",
  };
  const type = option?.type || "onapi";
  const version = option?.version || "3.0";
  const user_config = getUserConfig(context);
  const project_config = getCurrentProjectConfig(context);
  const apiList = getApiList(context);
  if (type === "environment" || type === "globals") {
    const settings = project_config?.http || createDefaultHttpConfig();
    const scope =
      type === "globals"
        ? settings.options.globals
        : settings.environments.find(
            (environment) => environment.id === settings.activeEnvironment,
          );
    if (!scope) {
      throw new Error("No environment selected");
    }
    return {
      fileName: `${scope.name || type}.postman_${type}.json`,
      fileText: JSON.stringify(scope, null, 2),
    };
  }

  const json = getExportApiData({ apis: apiList || [] }, context);

  if (type === EXPORT_TYPE_ENUM.postman) {
    result.fileName = `${user_config?.currentProject?.name || ""}_onapi_postman.json`;
    const swaggerRes = await exportMethod.apiToPostman(json);
    if (swaggerRes.status === "success") {
      showConverterWarnings(swaggerRes.warnings);
      result.fileText = JSON.stringify(swaggerRes.data, null, "\t");
    } else {
      result.fileText = JSON.stringify("", null, "\t");
      vscode.window.showErrorMessage(swaggerRes.message);
      throw new Error(swaggerRes.message);
    }
    return result;
  } else if (type === EXPORT_TYPE_ENUM.onapi) {
    const onapiData = {
      project_id: user_config?.currentProject?.project_id,
      name: user_config?.currentProject?.name,
      intro: user_config?.currentProject?.intro,
      global: {
        envs: project_config?.envList || [],
        servers: project_config?.serverList || [],
        global_vars: project_config?.globalVars || {},
        global_param: project_config?.globalParams || {},
      },
      apis: apiList || [],
    };
    result.fileName = `${user_config?.currentProject?.name || ""}_onapi.json`;
    result.fileText = JSON.stringify(onapiData, null, "\t");
    return result;
  } else if (type === EXPORT_TYPE_ENUM.swagger) {
    result.fileName = `${user_config?.currentProject?.name || ""}_openapi_${3.0}.json`;
    const res = await exportMethod.apiToSwagger(json, version, "en");
    if (res.status === "success") {
      showConverterWarnings(res.warnings);
      result.fileText = JSON.stringify(res.data, null, "\t");
    } else if (res?.status === "error") {
      vscode.window.showErrorMessage(res?.message);
      throw new Error(res?.message);
    }
    return result;
  }

  return result;
};
