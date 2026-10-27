import { createFeaturePanel } from "../../platform/webviews/create-panel";
import { globalConfig, PANEL_OPTIONS } from "../../app/config";
import * as vscode from "vscode";
import { getApiList, getApiListName } from "../requests/request-storage";
import { handelPushMessage } from "./push-handler";

export const createPushPanel = (
  data: any,
  context: vscode.ExtensionContext,
) => {
  let { pushWebView } = globalConfig;

  const panelOptions = PANEL_OPTIONS.PUSH;

  if (pushWebView) {
    // Tab already exists, switch to it
    pushWebView.reveal(vscode.ViewColumn.One);
    return;
  }
  // Create and show panel
  const panel = createFeaturePanel(context, panelOptions);

  const source = { panel, apiListName: getApiListName(context) };

  // Receive messages from Webview
  panel.webview.onDidReceiveMessage(
    async (message: { action: string; data: any }) => {
      await handelPushMessage(message, context, source);
    },
  );

  // Listen for Webview view visibility changes
  panel.onDidChangeViewState(() => {
    if (panel.visible) {
      // Get latest API list information
      const local_api_list = getApiList(context);
      // Get current user information
      let user_config: any = context.globalState.get("userConfig") || {};
      // Get version record of local project APIs
      let project_apis_version: any =
        context.globalState.get("projectApisVersion") || {};

      panel?.webview.postMessage({
        action: "setPushPanelData",
        data: {
          local_api_list,
          user_config,
          project_apis_version,
        },
      });
    }
  });

  // Triggered when tab is closed
  panel.onDidDispose(
    () => {
      if (globalConfig.pushWebView === panel) {
        globalConfig.pushWebView = null;
      }
      // When the panel is closed, cancel any future updates to the webview content
    },
    null,
    context.subscriptions,
  );
  globalConfig.pushWebView = panel;
};
