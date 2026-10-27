import {
  generateRequestCode,
  getCodeLanguages,
  selectCodeLanguage,
} from "./code-generation";
import { requestDefinition } from "@onapi/domain";
import type { RequestPanelMessage } from "./panel-message";
import { fetchGraphQLSchema } from "./graphql-schema";
import { handlePanelAction } from "../../platform/webviews/panel-actions";
import { relayExecutionEvent } from "../../platform/execution/webview-relay";
import { setRequestDraft } from "./request-status";
import { getApiListName } from "./request-storage";
import { getProtocolIcon } from "../sidebar/protocol-icon";
import * as vscode from "vscode";
import { recordRequestHistory } from "./request-history";
import { showTabName } from "../../platform/host-utils";
import { getApiList, updateApiList } from "./request-storage";
import { getMaxSort } from "../collections/collection-order";
import {
  getCurrentProjectConfig,
  setProjectConfig,
} from "../../platform/storage/project-config";
import {
  getCodeHarRequest,
  getResolvedCodeRequest,
  sendApi,
  stopWorker,
} from "./execution/http-runner";
import { globalConfig, DEFAULT_TARGET_NAME } from "../../app/config";
import { cloneDeep, forEach, isPlainObject, trim } from "lodash";
import {
  createShare,
  getProjectShareData,
  setProjectShareData,
} from "../sharing/share-data";
import { ApiDetailsData } from "@onapi/domain/requests/types/api";
import {
  prepareWebSocketSessionOptions,
  connectWebSocketSession,
  disconnectWebSocketSession,
  sendWebSocketMessage,
} from "./execution/websocket-session";
import {
  prepareSocketIoSessionOptions,
  connectSocketIoSession,
  disconnectSocketIoSession,
  sendSocketIoMessage,
  updateSocketIoSubscriptions,
} from "./execution/socketio-session";
import { proxyFetch } from "../../platform/http-client";

const saveRevisions = new WeakMap<vscode.WebviewPanel, number>();

const saveApiData = async (
  data: any,
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
  automatic = false,
) => {
  // Local stored data collection
  const newData: ApiDetailsData = requestDefinition(cloneDeep(data));
  const workspace = getApiListName(context);
  const revision = (saveRevisions.get(panel) || 0) + 1;
  saveRevisions.set(panel, revision);
  setRequestDraft(workspace, data.id, cloneDeep(data));
  if (data.name?.trim()) {
    panel.title = showTabName(data.name) + " ⚈";
  } else if (!panel.title.endsWith(" ⚈")) {
    panel.title += " ⚈";
  }
  if (trim(newData?.name).length <= 0) {
    newData.name = DEFAULT_TARGET_NAME?.[newData?.kind] || "HTTP Request";
  }
  const saved = await updateApiList(context, (apiList) => {
    const index = apiList.findIndex((item) => item.id === newData.id);
    if (index >= 0) {
      apiList[index] = newData;
    } else {
      newData.sort = getMaxSort(apiList, newData.parentId);
      apiList.push(newData);
    }
    return apiList;
  });
  if (
    saveRevisions.get(panel) !== revision ||
    getApiListName(context) !== workspace
  ) {
    return saved;
  }
  if (!saved) {
    vscode.window.showErrorMessage(
      "Failed to save requests. Please try again.",
    );
    return false;
  }
  setRequestDraft(getApiListName(context), newData.id);
  // Save and update open
  // Automatic saves must not replace newer edits already in the Webview.
  panel.webview.postMessage({
    action: "requestSaved",
    data: { definition: newData, submitted: data },
  });

  // Update title
  panel.title = showTabName(newData?.name);
  const protocolIcon = getProtocolIcon(context, newData);
  if (protocolIcon) {
    panel.iconPath = protocolIcon;
  }

  // Check if share record exists, update share time if so
  const shareData = getProjectShareData(context);
  if (shareData?.[newData.id]) {
    shareData[newData.id].share_time = Date.now();
    setProjectShareData(shareData, context);
  }

  if (!automatic) {
    vscode.window.showInformationMessage("Save Successfully！🎉");
  }
};

export const handelOpenMessage = async (
  message: RequestPanelMessage,
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
  apiData: ApiDetailsData,
) => {
  const { environmentWebView } = globalConfig;
  const { action, data } = message;

  if (await handlePanelAction(message, context, panel)) {
    return;
  }

  switch (action) {
    case "saveApiData":
      await saveApiData(data, context, panel);
      break;
    case "updateApiActiveData":
      if (["api", "sse", "graphql", "folder"].includes(data.kind)) {
        await saveApiData(data, context, panel, true);
        break;
      }
      setRequestDraft(getApiListName(context), data.id, cloneDeep(data));
      // Update title
      panel.title = showTabName(data?.name) + " ⚈";
      const activeProtocolIcon = getProtocolIcon(context, data);
      if (activeProtocolIcon) {
        panel.iconPath = activeProtocolIcon;
      }
      break;
    case "sendApi":
    case "sendSse":
      await recordRequestHistory(context, data);
      await sendApi(
        data,
        context,
        (event) => relayExecutionEvent(panel.webview, event),
        panel,
      );
      break;
    case "stopSendApi":
      stopWorker(panel);
      break;

    case "openEnv":
      vscode.commands.executeCommand("onapi.openEnv", data);
      break;
    case "openTagPanelById":
      const curData = getApiList(context).find(
        (i: ApiDetailsData) => i?.id === message.data,
      );
      if (!curData) {
        break;
      }
      vscode.commands.executeCommand("openTabPanel", curData);
      break;

    case "setProjectConfig":
      const { key, value } = data;
      // Local stored data collection
      let project_config: any = getCurrentProjectConfig(context);
      project_config[key] = value;
      await setProjectConfig(context, project_config);
      break;

    case "setSystemConfig":
      // Local stored data collection
      let default_system_config: any =
        context.globalState.get("systemConfig") || {};
      if (isPlainObject(data)) {
        forEach(data, (value, key) => {
          default_system_config[key] = value;
        });
      }

      context.globalState.update("systemConfig", default_system_config);

      // Notify other open tabs
      forEach(globalConfig.openedPanels, (openedPanel, key) => {
        openedPanel.webview.postMessage({
          action: "setSystemConfig",
          data: default_system_config || {},
        });
      });

      break;
    case "createShare":
      createShare(data, context);
      break;

    case "generateCode": {
      try {
        const languages = getCodeLanguages();
        const selection = selectCodeLanguage(data.language, data.variant);
        const request = await getResolvedCodeRequest(
          data.apiData,
          context,
          message.option,
        );
        const code = await generateRequestCode(
          request,
          selection.language,
          selection.variant,
        );
        panel.webview.postMessage({
          action: "generatedCode",
          data: {
            requestId: data.requestId,
            code,
            languages,
            ...selection,
          },
        });
      } catch (error) {
        panel.webview.postMessage({
          action: "generatedCode",
          data: {
            requestId: data.requestId,
            error: String(error),
          },
        });
      }
      break;
    }
    case "getCodeHar":
      const codeHar = await getCodeHarRequest(
        data.apiData,
        context,
        message?.option,
      );
      // Send HAR request results back to Webview
      panel.webview.postMessage({ action: "setCodeHar", data: codeHar });
      break;
    case "copyAsCurl": {
      try {
        const request = await getResolvedCodeRequest(
          data.apiData,
          context,
          message.option,
        );
        await vscode.env.clipboard.writeText(
          await generateRequestCode(request, "curl", "cURL"),
        );
      } catch (error) {
        vscode.window.showErrorMessage(String(error));
      }
      break;
    }
    case "ws_connect":
      await recordRequestHistory(context, data.target);
      data.option = await prepareWebSocketSessionOptions(data, context);

      connectWebSocketSession(data);
      break;
    case "ws_disconnect":
      disconnectWebSocketSession(data);
      break;
    case "ws_send":
      sendWebSocketMessage(data);
      break;
    case "socketio_connect":
      await recordRequestHistory(context, data.target);
      data.option = await prepareSocketIoSessionOptions(data, context);

      connectSocketIoSession(data);
      break;
    case "socketio_disconnect":
      disconnectSocketIoSession(data);
      break;
    case "socketio_send":
      sendSocketIoMessage(data);
      break;
    case "socketio_update_event":
      updateSocketIoSubscriptions(data);
      break;
    case "/proxy/fetch":
      proxyFetch(data, panel);
      break;
    case "getGraphQLSchema":
      await fetchGraphQLSchema(data, context, panel);
      break;
  }
};
