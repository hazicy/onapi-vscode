import * as vscode from "vscode";
import {
  getApiList,
  getApiListName,
  setApiList,
  setProjectApisVersion,
} from "../requests/request-storage";
import { getCurrentProjectConfig } from "../../platform/storage/project-config";
import { globalConfig } from "../../app/config";
import { applyApiVersions } from "@onapi/http-model/sync/utils/api-versions";

type PushSource = { panel: vscode.WebviewPanel; apiListName: string };

export const handelPushMessage = async (
  message: { action: string; data: any },
  context: vscode.ExtensionContext,
  source: PushSource,
) => {
  const isCurrentSource = () =>
    globalConfig.pushWebView === source.panel &&
    getApiListName(context) === source.apiListName;
  if (!isCurrentSource()) {
    return;
  }
  const pushWebView = source.panel;

  switch (message.action) {
    case "getPushPanelData":
      pushWebView.webview.postMessage({
        action: "setPushPanelData",
        data: {
          local_api_list: getApiList(context),
          user_config: context.globalState.get("userConfig") || {},
          project_apis_version:
            context.globalState.get("projectApisVersion") || {},
        },
      });
      break;
    case "openNewWindow":
      vscode.env.openExternal(vscode.Uri.parse(message.data));
      break;
    case "completePush": {
      const { project_id, versions } = message.data || {};
      if (
        typeof project_id !== "string" ||
        !project_id ||
        project_id === "-1" ||
        !Array.isArray(versions)
      ) {
        vscode.window.showErrorMessage(
          "Unable to save push results: invalid project or versions.",
        );
        return;
      }
      const validVersions = versions.filter(
        (item) =>
          typeof item?.id === "string" &&
          item.id.length > 0 &&
          typeof item.version === "number" &&
          Number.isFinite(item.version),
      );
      if (validVersions.length !== versions.length) {
        vscode.window.showErrorMessage(
          "Upload succeeded, but the returned API versions are invalid.",
        );
        return;
      }
      if (validVersions.length > 0) {
        const recorded = await setProjectApisVersion(
          context,
          validVersions.map((item) => ({ ...item, project_id })),
        );
        // A workspace switch or replacement panel can occur during the global-state write.
        if (!isCurrentSource()) {
          return;
        }
        if (!recorded) {
          vscode.window.showErrorMessage(
            "Upload succeeded, but project version records could not be saved.",
          );
          return;
        }
        // Read after awaiting metadata persistence, so concurrent local edits survive.
        const latest = getApiList(context);
        if (applyApiVersions(latest, validVersions)) {
          if (!(await setApiList(latest, context))) {
            vscode.window.showErrorMessage(
              "Upload succeeded, but local request versions could not be saved.",
            );
            return;
          }
          globalConfig.shareListWebView?.webview.postMessage({
            action: "setApiList",
            data: latest,
          });
        }
      }
      pushWebView.dispose();
      vscode.window.showInformationMessage("Push Successfully！🎉");
      break;
    }
    case "getSystemConfig":
      pushWebView.webview.postMessage({
        action: "setSystemConfig",
        data: context.globalState.get("systemConfig") || {},
      });
      break;
    case "getProjectConfig":
      pushWebView.webview.postMessage({
        action: "setProjectConfig",
        data: getCurrentProjectConfig(context),
      });
      break;
    case "openEnv":
      vscode.commands.executeCommand("onapi.openEnv", message.data);
      break;
  }
};
