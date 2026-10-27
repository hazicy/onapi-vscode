import { createFeaturePanel } from "../../platform/webviews/create-panel";
import { globalConfig, PANEL_OPTIONS } from "../../app/config";
import * as vscode from "vscode";
import { handelEnvMessage } from "./environment-handler";
import { ENV_MANAGE_ENUM } from "@onapi/http-model/environment";

export const createEnvironmentPanel = (
  data: any,
  context: vscode.ExtensionContext,
) => {
  let { environmentWebView } = globalConfig;

  const panelOptions = PANEL_OPTIONS.ENVIRONMENT;

  if (environmentWebView) {
    // Tab already exists, switch to it
    environmentWebView.reveal(vscode.ViewColumn.One);
    // Create new environment
    if (data?.create) {
      environmentWebView.webview.postMessage({ action: "initCreateEnv" });
    } else if (data?.global_param) {
      environmentWebView.webview.postMessage({
        action: "setEnvSettingKeys",
        data: ENV_MANAGE_ENUM.globalParm,
      });
      if (data?.global_param_tab_key) {
        environmentWebView.webview.postMessage({
          action: "setProjectConfig",
          data: {
            globalParamsTabKey: data.global_param_tab_key,
          },
        });
      }
    } else if (!data?.cookie) {
      environmentWebView.webview.postMessage({
        action: "setEnvSettingKeys",
        data: !data?.env_id ? "1" : data?.env_id,
      });
    }
    if (data?.cookie) {
      environmentWebView.webview.postMessage({
        action: "setEnvSettingKeys",
        data: ENV_MANAGE_ENUM.cookie,
      });
    }
    return;
  }
  // Create and show panel
  const panel = createFeaturePanel(context, panelOptions);

  // Receive messages from Webview
  panel.webview.onDidReceiveMessage(
    async (message: { action: string; data: any }) => {
      handelEnvMessage(message, context, data, panel);
    },
  );

  // Triggered when tab is closed
  panel.onDidDispose(
    () => {
      globalConfig.environmentWebView = null;
    },
    null,
    context.subscriptions,
  );
  globalConfig.environmentWebView = panel;
};
