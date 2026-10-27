import { WebSocketDetailsData } from "@onapi/http-model/requests/types/websocket";
import { WebSocketAdapter } from "@onapi/runtime/websocket/adapter";
import { globalConfig } from "../../../app/config";
import * as vscode from "vscode";
import { ProjectConfigType } from "@onapi/http-model/project/types/index";
import { prepareSocketOptions } from "./prepare-socket-options";
import { getApiList } from "../request-storage";
import { getCurrentProjectConfig } from "../../../platform/storage/project-config";
import { getSocketCollection } from "@onapi/http-model/request-utils";
import { SysConfig } from "@onapi/http-model/settings/types/settings";
import { applySocketSettings } from "./socket-settings";
import { randomUUID } from "node:crypto";
import { executionService } from "../../../platform/execution/service";
import { relayExecutionEvent } from "../../../platform/execution/webview-relay";

const sessions = new Map<string, WebSocketAdapter>();
export const disconnectWebSocketSession = (targetId: string) => {
  sessions.get(targetId)?.cancel();
};
export const connectWebSocketSession = async (data: {
  option: any;
  target: WebSocketDetailsData;
}) => {
  const id = data.target?.id;
  if (!id) {
    return;
  }
  sessions.get(id)?.cancel();
  const adapter = new WebSocketAdapter();
  sessions.set(id, adapter);
  try {
    await executionService.execute(adapter, data, {
      sessionId: randomUUID(),
      targetId: id,
      observer: (event) => {
        const panel = globalConfig.openedPanels[id];
        if (sessions.get(id) === adapter && panel) {
          relayExecutionEvent(panel.webview, event);
        }
      },
    });
  } catch (error) {
    console.error(error);
  } finally {
    if (sessions.get(id) === adapter) {
      sessions.delete(id);
    }
  }
};
export const sendWebSocketMessage = async (data: {
  id: string;
  msg?: unknown;
  type?: string;
}) => {
  try {
    await sessions.get(data.id)?.send(data);
  } catch {
    /* Adapter publishes send errors. */
  }
};

export const prepareWebSocketSessionOptions = async (
  data: { option: any; target: any },
  context: vscode.ExtensionContext,
) => {
  const projectConfig = getCurrentProjectConfig(context) as ProjectConfigType;
  const apiList = getApiList(context);
  const { option, target } = data;
  const systemConfig =
    (context.globalState.get("systemConfig") as SysConfig) || {};

  const envDetailKeys = projectConfig?.envDetailKeys;

  // Parent directory related parameters
  const _collection = await getSocketCollection(
    target,
    apiList,
    option?.server_id,
  );

  const options = await prepareSocketOptions({
    envId: envDetailKeys,
    scene: "http_request",
    collection: _collection,
    curServerId: option?.server_id,
    projectConfig,
    systemConfig,
    targetId: target?.id,
    type: target?.kind,
  });

  return applySocketSettings(
    options,
    systemConfig,
    vscode.workspace.getConfiguration("http").get<string>("proxy", ""),
  );
};
