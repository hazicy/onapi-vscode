import { executionScopeFor } from "../../../platform/execution/owners";
import {
  WebSocketAdapter,
  type WebSocketExecutionRequest,
} from "@onapi/runtime/websocket/adapter";
import { globalConfig } from "../../../app/config";
import * as vscode from "vscode";
import { ProjectConfigType } from "@onapi/domain/project/types/index";
import { prepareSocketOptions } from "./prepare-socket-options";
import { getApiList } from "../request-storage";
import { getCurrentProjectConfig } from "../../../platform/storage/project-config";
import { getSocketCollection } from "@onapi/domain/request-utils";
import { SysConfig } from "@onapi/domain/settings/types/settings";
import { applySocketSettings } from "./socket-settings";
import { randomUUID } from "node:crypto";
import { executionService } from "../../../platform/execution/service";
import { relayExecutionEvent } from "../../../platform/execution/webview-relay";

const scopeForTarget = (id: string) => {
  const panel = globalConfig.openedPanels[id];
  return panel && executionScopeFor(panel);
};
export const disconnectWebSocketSession = (targetId: string) => {
  void scopeForTarget(targetId)?.get(`websocket:${targetId}`)?.cancel();
};
export const connectWebSocketSession = async (
  data: WebSocketExecutionRequest,
) => {
  const id = data.target?.id;
  if (!id) {
    return;
  }
  const panel = globalConfig.openedPanels[id];
  if (!panel) {
    return;
  }
  const adapter = new WebSocketAdapter();
  const run = executionScopeFor(panel).reserve(
    `websocket:${id}`,
    randomUUID(),
    id,
    adapter,
  );
  await run
    .execute(executionService, adapter, data, (event) =>
      relayExecutionEvent(panel.webview, event),
    )
    .catch(() => {});
};
export const sendWebSocketMessage = async (data: {
  id: string;
  msg?: unknown;
  type?: string;
}) => {
  try {
    await scopeForTarget(data.id)
      ?.adapter(`websocket:${data.id}`, WebSocketAdapter)
      ?.send(data);
  } catch {
    /* Adapter publishes send errors. */
  }
};

export const prepareWebSocketSessionOptions = async (
  data: { option?: any; target: any },
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
