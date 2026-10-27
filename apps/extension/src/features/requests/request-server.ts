import type * as vscode from "vscode";
import { find, isEqual, isObject, isUndefined } from "lodash";
import { getCurrentProjectConfig } from "../../platform/storage/project-config";

export const getCurrentRequestServer = (
  context: vscode.ExtensionContext,
  curServerId: string,
) => {
  const { envDetailKeys, envList, serverList } =
    getCurrentProjectConfig(context) || {};
  let curEnv: any = find(envList, (env) => isEqual(env.env_id, envDetailKeys));

  if (isUndefined(curEnv) || !isObject(curEnv)) {
    curEnv = {
      env_id: "",
      env_name: "",
      env_pre_url: "",
      env_pre_urls: {},
      environment: {},
    };
  }

  const defaultSererId =
    curServerId ||
    find(serverList, (im) => im?.is_default === 1)?.server_id ||
    "";

  const defaultServer =
    find(curEnv?.server_list, (findItem) =>
      isEqual(findItem?.server_id, defaultSererId),
    ) || {};

  return defaultServer;
};
