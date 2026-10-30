import * as vscode from "vscode";
import {
  getCurrentProjectConfig,
  setProjectConfig,
} from "../../platform/storage/project-config";
import { globalConfig } from "../../app/config";
import { forEach, isPlainObject } from "lodash";
import { ENV_MANAGE_ENUM } from "@onapi/domain/environment";
import { proxyFetch } from "../../platform/http-client";

export const handelEnvMessage = async (
  message: { action: string; data: any },
  context: vscode.ExtensionContext,
  data: any,
  panel: vscode.WebviewPanel,
) => {
  let {} = globalConfig;
  switch (message.action) {
    case "getProjectConfig":
      let local_project_config: any = getCurrentProjectConfig(context);
      // Initialize create env
      if (data?.create) {
        local_project_config.establish = true;
      }

      if (!data?.cookie) {
        local_project_config.envSettingKeys =
          data?.id || local_project_config.http?.activeEnvironment || "";
      }

      if (data?.cookie) {
        local_project_config.envSettingKeys = ENV_MANAGE_ENUM.cookie;
      }

      if (data?.global_param) {
        local_project_config.envSettingKeys = ENV_MANAGE_ENUM.globalParm;
      }

      if (data?.global_param_tab_key) {
        local_project_config.globalParamsTabKey = data.global_param_tab_key;
      }

      // Update page
      panel.webview.postMessage({
        action: "setProjectConfig",
        data: local_project_config || {},
      });
      break;
    case "getSystemConfig":
      let systemConfig: any = context.globalState.get("systemConfig") || {};
      panel.webview.postMessage({
        action: "setSystemConfig",
        data: systemConfig || {},
      });
      break;
    case "getVscodeTheme":
      const vscodeTheme = vscode.workspace
        .getConfiguration("workbench")
        .get("colorTheme");
      panel.webview.postMessage({
        action: "setVscodeTheme",
        data: vscodeTheme,
      });
      break;
    case "setProjectConfig":
      const { key, value } = message.data;
      // Local stored data collection
      let project_config: any = getCurrentProjectConfig(context);
      project_config[key] = value;
      await setProjectConfig(context, project_config);
      break;
    case "setSystemConfig":
      // Local stored data collection
      let default_system_config: any =
        context.globalState.get("systemConfig") || {};
      if (isPlainObject(message.data)) {
        forEach(message.data, (value, key) => {
          default_system_config[key] = value;
        });
      }

      context.globalState.update("systemConfig", default_system_config);

      // Notify other open tabs
      forEach(globalConfig.openedPanels, (openedPanel) => {
        openedPanel.webview.postMessage({
          action: "setSystemConfig",
          data: default_system_config || {},
        });
      });

      break;

    case "openNewWindow":
      vscode.env.openExternal(vscode.Uri.parse(message.data));
      break;
    case "/proxy/fetch":
      proxyFetch(message.data, panel);
      break;
  }
};
