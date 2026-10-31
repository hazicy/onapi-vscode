import { saveRequestDraft, updateRequestDraft } from "./request-autosave";
import { postRequestPanelResponse } from "../../platform/webviews/request-panel-channel";
import type { RequestPanelCommand } from "@onapi/contracts/request-panel";
import { fetchGraphQLSchema } from "./graphql-schema";
import { handlePanelAction } from "../../platform/webviews/panel-actions";
import { relayExecutionEvent } from "../../platform/execution/webview-relay";
import * as vscode from "vscode";
import { recordRequestHistory } from "./request-history";
import { getApiList } from "./request-storage";
import {
  getCurrentProjectConfig,
  setProjectConfig,
} from "../../platform/storage/project-config";
import {
  getCodeHarRequest,
  getResolvedCodeRequest,
  sendApi,
  stopWorker,
  reserveHttpExecution,
} from "./execution/http-runner";
import { globalConfig } from "../../app/config";
import { forEach, isPlainObject } from "lodash";
import { createShare } from "../sharing/share-data";
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

export const handleRequestPanelCommand = async (
  message: RequestPanelCommand,
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
) => {
  const { action, data } = message;

  if (await handlePanelAction(message, context, panel)) {
    return;
  }

  switch (action) {
    case "saveApiData":
      await saveRequestDraft(context, panel, data, message.requestId);
      break;
    case "updateApiActiveData":
      updateRequestDraft(context, panel, data, message.requestId);
      break;
    case "sendApi":
    case "sendSse": {
      const executionId = message.executionId;
      reserveHttpExecution(panel, executionId, context);
      let sequence = 0;
      const emit = (event: import("@onapi/contracts").ExecutionEnvelope) => {
        sequence = Math.max(sequence, event.sequence);
        relayExecutionEvent(panel.webview, event);
      };
      try {
        await recordRequestHistory(context, data);
        await sendApi(data, context, emit, panel, executionId);
      } catch (error) {
        emit({
          protocolVersion: 1,
          sessionId: executionId,
          targetId: data.id,
          sequence: sequence + 1,
          timestamp: Date.now(),
          event: {
            protocol: "http",
            type: "execution.error",
            error: {
              message: error instanceof Error ? error.message : String(error),
            },
          },
        });
      } finally {
        stopWorker(panel, executionId);
      }
      break;
    }
    case "stopSendApi":
      stopWorker(panel, message.executionId);
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

      await context.globalState.update("systemConfig", default_system_config);

      // Notify other open tabs
      forEach(globalConfig.openedPanels, (openedPanel) => {
        postRequestPanelResponse(openedPanel.webview, {
          action: "setSystemConfig",
          data: default_system_config || {},
        });
      });

      break;
    case "createShare":
      await createShare(data, context);
      break;

    case "generateCode": {
      try {
        const { generateRequestCode, getCodeLanguages, selectCodeLanguage } =
          await import("./code-generation");
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
        postRequestPanelResponse(panel.webview, {
          action: "generatedCode",
          ...(message.requestId ? { requestId: message.requestId } : {}),
          data: {
            requestId: data.requestId,
            code,
            languages,
            ...selection,
          },
        });
      } catch (error) {
        postRequestPanelResponse(panel.webview, {
          action: "generatedCode",
          ...(message.requestId ? { requestId: message.requestId } : {}),
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
      postRequestPanelResponse(panel.webview, {
        action: "setCodeHar",
        data: codeHar,
      });
      break;
    case "copyAsCurl": {
      try {
        const { generateRequestCode } = await import("./code-generation");
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
      connectWebSocketSession({
        target: data.target,
        option: await prepareWebSocketSessionOptions(
          { ...data, option: data.option },
          context,
        ),
      });
      break;
    case "ws_disconnect":
      disconnectWebSocketSession(data);
      break;
    case "ws_send":
      await sendWebSocketMessage(data);
      break;
    case "socketio_connect":
      await recordRequestHistory(context, data.target);
      connectSocketIoSession({
        target: data.target,
        option: await prepareSocketIoSessionOptions(
          { ...data, option: data.option },
          context,
        ),
      });
      break;
    case "socketio_disconnect":
      disconnectSocketIoSession(data);
      break;
    case "socketio_send":
      await sendSocketIoMessage(data);
      break;
    case "socketio_update_event":
      await updateSocketIoSubscriptions(data);
      break;
    case "/proxy/fetch":
      await proxyFetch(data, panel, message.requestId);
      break;
    case "getGraphQLSchema":
      await fetchGraphQLSchema(data, context, panel, message.requestId);
      break;
  }
};
