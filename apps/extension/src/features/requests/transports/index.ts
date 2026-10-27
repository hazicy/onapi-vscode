import {
  EnvListItem,
  ServerItem,
} from "@onapi/http-model/environment/types/index";
import {
  cloneDeep,
  concat,
  find,
  forEach,
  includes,
  isArray,
  isEqual,
  isNumber,
  isObject,
  isPlainObject,
  isString,
  isUndefined,
  map,
  omit,
  reduce,
  size,
  values,
} from "lodash";
import { Cookies, Env } from "./options";
import { DomainInfoProps } from "@onapi/http-model/project/types/cookie";
import { SysConfig } from "@onapi/http-model/settings/types/settings";
import { getCollectionServerId } from "@onapi/http-model/request-utils";
import { ApiDetailsData } from "@onapi/http-model/requests/types/api";

// Get project related information
export const getProjectOptions = (
  globalParams: any,
  systemConfig: SysConfig | undefined,
  kind?: string,
) => {
  // System default header
  const systemRequestHeader = systemConfig?.systemRequestHeader || [];
  const systemRequestHeaderWebSocket =
    systemConfig?.systemRequestHeaderWebSocket || [];

  const result = cloneDeep({
    request: { ...omit(globalParams, ["script"]) },
  });

  const _systemRequestHeader = map(
    isEqual(kind, "socketio")
      ? []
      : includes(["websocket"], kind)
        ? systemRequestHeaderWebSocket
        : systemRequestHeader,
    (item) => ({ ...item, is_system: 1 }),
  );

  if (
    !!_systemRequestHeader &&
    result.request.header &&
    size(result.request.header?.parameter) >= 0
  ) {
    result.request.header.parameter =
      result.request.header?.parameter.concat(_systemRequestHeader as any[]) ||
      [];
  }

  return result;
};

// Get API base URL
export const getBaseUrl = (
  id: string,
  apisData: Array<ApiDetailsData>,
  defaultServerId: string,
  envInfo?: EnvListItem,
): string => {
  let parents_data = apisData.reduce((pre, cur) => {
    if (isString(cur?.id)) {
      pre[cur.id] = cur;
    }
    return pre;
  }, {} as any);
  const currentServerId = getCollectionServerId(
    id,
    parents_data,
    defaultServerId,
  );
  const serversData = find(
    envInfo?.server_list,
    (it) => it?.server_id === currentServerId,
  );

  return serversData?.uri || "";
};

// Get base URL collection data for specified environment
export const getEnvPreUrls = (envData: EnvListItem, server_id: string) => {
  if (size(envData?.server_list) <= 0) {
    return {};
  }

  const defaultEnv =
    find(envData?.server_list, (findItem) =>
      isEqual(findItem?.server_id, server_id),
    ) || {};
  const result: { [x: string]: any } = {
    default: defaultEnv,
  };

  forEach(envData?.server_list, (item) => {
    if (item.server_id) {
      result[item.server_id] = { ...item };
    }
  });

  return result;
};

// Get environment related information
export const getEnvOptions = (
  envData: EnvListItem | undefined,
  serverList: ServerItem[] | undefined,
  curServerId: string | undefined,
  id: string,
  collections: any,
) => {
  if (isUndefined(envData) || !isObject(envData)) {
    return {
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
  const env_pre_url =
    getBaseUrl(id, collections, defaultSererId, envData) || "";
  const env_pre_urls = getEnvPreUrls(envData, defaultSererId);

  const result: Env = {
    env_id: envData?.env_id || "",
    env_name: envData?.name || "",
    env_pre_url,
    env_pre_urls,
    environment: {},
  };

  if (isPlainObject(envData?.env_var_list)) {
    Object.keys(envData.env_var_list).forEach((key) => {
      const item = envData.env_var_list[key as any];

      if (isString(item?.current_value) || isNumber(item?.current_value)) {
        result.environment[key] = item.current_value;
      } else {
        result.environment[key] = item.value;
      }
    });
  }

  return result;
};

// Get global cookie related information
export const getCookiesOptions = (
  domainInfo: DomainInfoProps | undefined,
  systemConfig: SysConfig | undefined,
) => {
  const cookies = reduce(
    values(domainInfo?.cookieObj),
    (prev: any, curr) => {
      return concat(prev, curr);
    },
    [],
  );

  const result: Cookies = {
    switch: isNumber(systemConfig?.global_cookie_open)
      ? systemConfig?.global_cookie_open
      : 1,
    data: [],
  };

  if (isArray(cookies) && isEqual(result.switch, 1)) {
    result.data = cookies;
  }
  return result;
};
