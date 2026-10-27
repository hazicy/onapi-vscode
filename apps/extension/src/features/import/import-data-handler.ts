import * as vscode from "vscode";
import { globalConfig } from "../../app/config";
import {
  getApiList,
  setApiList,
  updateApiList,
} from "../requests/request-storage";
import {
  getCurrentProjectConfig,
  setProjectConfig,
  getCurrentProjectId,
} from "../../platform/storage/project-config";
import { curlImport } from "../curl/import-curl";
import { importMethod } from "@onapi/api-converter/export";
import { IMPORT_TYPE_ENUM } from "@onapi/domain/settings/constants/settings";
import { fromPostmanCollection, createDefaultHttpConfig } from "@onapi/domain";

export async function handelImportDataMessage(
  message: { action: string; data: any },
  context: vscode.ExtensionContext,
  _data: any,
) {
  const panel = globalConfig.importDataWebView;
  switch (message.action) {
    case "getUserConfig":
      panel?.webview.postMessage({
        action: "setUserConfig",
        data: context.globalState.get("userConfig") || {},
      });
      break;
    case "getApiList":
      panel?.webview.postMessage({
        action: "setApiList",
        data: getApiList(context),
      });
      break;
    case "getImportData": {
      try {
        const { json, fileType, formData } = message.data;
        let result: any;
        if (Array.isArray(json?.values)) {
          result = {
            status: "success",
            data: {
              apis: [],
              envs: [{ ...json, id: json.id || crypto.randomUUID() }],
            },
          };
        } else if (fileType === IMPORT_TYPE_ENUM.POSTMAN) {
          result = await importMethod.postmanToApipost(
            json,
            getCurrentProjectId(context),
          );
        } else if (fileType === IMPORT_TYPE_ENUM.THUNDER_CLIENT) {
          result = await importMethod.thunderToApipost(
            json,
            getCurrentProjectId(context),
          );
        } else if (
          [IMPORT_TYPE_ENUM.SWAGGER, IMPORT_TYPE_ENUM.SWAGGERURL].includes(
            fileType,
          )
        ) {
          result = await importMethod.swaggerToApipost(json, {
            basePath: !!formData?.basePath,
            host: !!formData?.hostPath,
          });
        } else if (fileType === IMPORT_TYPE_ENUM.ONAPI && json?.http) {
          result = { status: "success", data: json };
        } else {
          throw new Error("Unsupported import format");
        }
        if (result?.status !== "success") {
          throw new Error(result?.message || "Invalid collection");
        }
        const data = { models: [], envs: [], ...result.data };
        panel?.webview.postMessage({
          action: "setImportData",
          type: data.apis?.length ? "select_apis" : "select_envs",
          data,
        });
      } catch (error: any) {
        vscode.window.showErrorMessage(error.message);
      }
      break;
    }
    case "importData": {
      const {
        newApis = [],
        newEnvs = [],
        chooseFolder = "0",
        http,
      } = message.data;
      const rows = getApiList(context);
      if (
        chooseFolder !== "0" &&
        !rows.some((row) => row.id === chooseFolder)
      ) {
        vscode.window.showErrorMessage(
          "The selected directory has been deleted",
        );
        return false;
      }
      const config = getCurrentProjectConfig(context);
      const settings = config.http || createDefaultHttpConfig();
      const imported = structuredClone(newApis);
      // The imported root is a native folder, preserving its auth, scripts and variables.
      if (http?.collection && imported.length) {
        const root = http.collection;
        const id = crypto.randomUUID();
        imported.forEach((row: any) => {
          if (!row.parentId || row.parentId === "0") {
            row.parentId = id;
          }
        });
        imported.unshift({
          id,
          kind: "folder",
          parentId: chooseFolder,
          name: root.info?.name || "Imported collection",
          auth: root.auth,
          event: root.event,
          variable: root.variable,
        });
      } else {
        imported.forEach((row: any) => {
          if (!row.parentId || row.parentId === "0") {
            row.parentId = chooseFolder;
          }
        });
      }
      const saved = {
        ...settings,
        environments: [...settings.environments, ...newEnvs],
      };
      if (!(await setProjectConfig(context, { ...config, http: saved }))) {
        return false;
      }
      if (
        !(await updateApiList(context, (latest) => [...latest, ...imported]))
      ) {
        return false;
      }
      vscode.window.showInformationMessage("Import Successful");
      panel?.dispose();
      break;
    }
    case "importPostmanCollection":
      try {
        const collection = message.data.collection;
        if (!collection?.info || !Array.isArray(collection.item)) {
          throw new Error("Invalid Postman collection");
        }
        const config = getCurrentProjectConfig(context);
        const settings = config.http || createDefaultHttpConfig();
        const { item: _items, ...metadata } = collection;
        if (
          !(await setProjectConfig(context, {
            ...config,
            http: { ...settings, collection: metadata },
          }))
        ) {
          throw new Error("Failed to save collection");
        }
        if (
          !(await setApiList(fromPostmanCollection(collection) as any, context))
        ) {
          throw new Error("Failed to save requests");
        }
        panel?.webview.postMessage({ action: "postmanImportComplete" });
      } catch (error: any) {
        panel?.webview.postMessage({
          action: "postmanImportError",
          data: error.message,
        });
      }
      break;
    case "getProjectConfig":
      panel?.webview.postMessage({
        action: "setProjectConfig",
        data: getCurrentProjectConfig(context),
      });
      break;
    case "getSystemConfig":
      panel?.webview.postMessage({
        action: "setSystemConfig",
        data: context.globalState.get("systemConfig") || {},
      });
      break;
    case "getVscodeTheme":
      panel?.webview.postMessage({
        action: "setVscodeTheme",
        data: vscode.workspace.getConfiguration("workbench").get("colorTheme"),
      });
      break;
    case "curlImport":
      await curlImport(message.data);
      break;
  }
}
