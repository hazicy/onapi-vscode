import { executionScopeFor } from "../../../platform/execution/owners";
import { globalConfig } from "../../../app/config";
import {
  SocketIoAdapter,
  type SocketIoExecutionRequest,
} from "@onapi/runtime/socketio/adapter";
import { applySocketSettings } from "./socket-settings";
import * as vscode from "vscode";
import {
  createTargetIdMap,
  getSocketCollection,
} from "@onapi/domain/request-utils";
import { SysConfig } from "@onapi/domain/settings/types/settings";
import { prepareSocketOptions } from "./prepare-socket-options";
import { getApiList } from "../request-storage";
import { getCurrentProjectConfig } from "../../../platform/storage/project-config";
import { ProjectConfigType } from "@onapi/domain/project/types/index";
import { find, isEqual } from "lodash";
import { randomUUID } from "node:crypto";
import { executionService } from "../../../platform/execution/service";
import { relayExecutionEvent } from "../../../platform/execution/webview-relay";

const scopeForTarget = (id: string) => {
  const panel = globalConfig.openedPanels[id];
  return panel && executionScopeFor(panel);
};
export const disconnectSocketIoSession = (targetId: string) => {
  void scopeForTarget(targetId)?.get(`socketio:${targetId}`)?.cancel();
};
export const connectSocketIoSession = async (
  data: SocketIoExecutionRequest,
) => {
  const id = data.target?.id;
  if (!id) {
    return;
  }
  const panel = globalConfig.openedPanels[id];
  if (!panel) {
    return;
  }
  const adapter = new SocketIoAdapter();
  const run = executionScopeFor(panel).reserve(
    `socketio:${id}`,
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
export const sendSocketIoMessage = async (data: {
  id: string;
  event: string;
  msg: unknown;
  is_ack: boolean | number | string;
  type?: string;
}) => {
  try {
    await scopeForTarget(data.id)
      ?.adapter(`socketio:${data.id}`, SocketIoAdapter)
      ?.send(data);
  } catch {
    /* Adapter publishes send errors. */
  }
};
export const updateSocketIoSubscriptions = async (data: {
  id: string;
  parameter: any[];
}) => {
  if (data.parameter) {
    scopeForTarget(data.id)
      ?.adapter(`socketio:${data.id}`, SocketIoAdapter)
      ?.updateEvent(data.parameter);
  }
};

export const prepareSocketIoSessionOptions = async (
  data: { option: any; target: any },
  context: vscode.ExtensionContext,
) => {
  const projectConfig = getCurrentProjectConfig(context) as ProjectConfigType;
  const apiList = getApiList(context);
  const { option, target } = data;
  const systemConfig =
    (context.globalState.get("systemConfig") as SysConfig) || {};
  // Parent directory related parameters
  const _collection = await getSocketCollection(
    target,
    apiList,
    option?.server_id,
  );

  const curEnv = find(projectConfig?.envList || [], (env) =>
    isEqual(env.env_id, projectConfig?.envDetailKeys),
  );

  // Create id mapping and remove extra fields
  const targetIdMap = createTargetIdMap(_collection, curEnv?.server_list);

  if (_collection) {
    for (let index = 0; index < _collection.length; index++) {
      const item = _collection[index];
      _collection[index] = targetIdMap.get(item.id) || item;
    }
  }
  const options = await prepareSocketOptions({
    collection: _collection,
    projectConfig,
    systemConfig,
    curServerId: option?.server_id,
    targetId: target?.id,
    type: target?.kind,
  });
  return applySocketSettings(
    options,
    systemConfig,
    vscode.workspace.getConfiguration("http").get<string>("proxy", ""),
  );
};
