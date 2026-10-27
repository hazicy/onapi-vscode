import { globalConfig } from "../../../app/config";
import { SocketIoAdapter } from "@onapi/runtime/socketio/adapter";
import { applySocketSettings } from "./socket-settings";
import * as vscode from "vscode";
import { SocketIoDetailsData } from "@onapi/http-model/requests/types/socketio";
import {
  createTargetIdMap,
  getSocketCollection,
} from "@onapi/http-model/request-utils";
import { SysConfig } from "@onapi/http-model/settings/types/settings";
import { prepareSocketOptions } from "./prepare-socket-options";
import { getApiList } from "../request-storage";
import { getCurrentProjectConfig } from "../../../platform/storage/project-config";
import { ProjectConfigType } from "@onapi/http-model/project/types/index";
import { find, isEqual } from "lodash";
import { randomUUID } from "node:crypto";
import { executionService } from "../../../platform/execution/service";
import { relayExecutionEvent } from "../../../platform/execution/webview-relay";

const sessions = new Map<string, SocketIoAdapter>();
export const disconnectSocketIoSession = (targetId: string) => {
  sessions.get(targetId)?.cancel();
};
export const connectSocketIoSession = async (data: {
  option: any;
  target: SocketIoDetailsData;
}) => {
  const id = data.target?.id;
  if (!id) {
    return;
  }
  sessions.get(id)?.cancel();
  const adapter = new SocketIoAdapter();
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
export const sendSocketIoMessage = async (data: {
  id: string;
  event: string;
  msg: unknown;
  is_ack: boolean | number | string;
  type?: string;
}) => {
  try {
    await sessions.get(data.id)?.send(data);
  } catch {
    /* Adapter publishes send errors. */
  }
};
export const updateSocketIoSubscriptions = async (data: {
  id: string;
  parameter: any[];
}) => {
  if (data.parameter) {
    sessions.get(data.id)?.updateEvent(data.parameter);
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
    scene: "http_request",
    collection: _collection,
    databaseConfigs: {},
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
