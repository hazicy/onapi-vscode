import { cloneDeep, find, isEqual, keys, reduce } from "lodash";
import { PrepareSocketOptions, SocketHostOptions } from "./socket-option-types";
import { DEFAULT_SOCKET_GLOBAL_PARAMS } from "@onapi/domain/requests/constants/request";
import {
  getCookiesOptions,
  getEnvOptions,
  getProjectOptions,
} from "./socket-option-values";

export const prepareSocketOptions: PrepareSocketOptions = async ({
  envId,
  collection,
  projectConfig,
  systemConfig,
  curServerId,
  targetId,
  type,
}) => {
  const {
    envDetailKeys,
    envList,
    globalParams,
    globalVars,
    serverList,
    cookie,
  } = projectConfig || {};
  const curEnv = find(envList, (env) =>
    isEqual(env.env_id, envId || envDetailKeys),
  );

  const options: SocketHostOptions = {};
  const nativeSettings = projectConfig?.http;
  const nativeEnvironment = nativeSettings?.environments.find(
    (scope) => scope.id === nativeSettings.activeEnvironment,
  );
  const scopeValues = (scope: any) =>
    Object.fromEntries(
      (scope?.values || [])
        .filter((entry: any) => !entry.disabled)
        .map((entry: any) => [entry.key, entry.value]),
    );

  // Global parameters
  options.globals = reduce(
    keys(globalVars),
    (prev: any, curr) => {
      prev[curr] = globalVars[curr]?.current_value || globalVars[curr]?.value;

      return prev;
    },
    {},
  );

  // Get project related information
  options.project = globalParams
    ? getProjectOptions(globalParams, systemConfig, type)
    : {
        request: cloneDeep(DEFAULT_SOCKET_GLOBAL_PARAMS),
      };

  // Get environment related parameters
  options.env = getEnvOptions(
    curEnv,
    serverList,
    curServerId,
    targetId || "",
    collection,
  );
  if (nativeSettings) {
    options.globals = scopeValues(nativeSettings.options.globals);
    options.env = {
      env_id: nativeEnvironment?.id || "",
      env_name: nativeEnvironment?.name || "",
      env_pre_url: "",
      env_pre_urls: {},
      environment: scopeValues(nativeEnvironment),
    };
  }

  // Global Cookie
  options.cookies = getCookiesOptions(cookie, systemConfig);

  // System configuration
  options.system_configs = {
    // Timeout
    send_timeout: 0,
    // Auto redirect
    auto_redirect: 1,
    // Max redirect count
    max_redirect_time: 5,
    // Auto detect mock
    auto_gen_mock_url: 1,
    // Auto JSON format
    request_param_auto_json: -1,
    // Proxy parameter handling
    proxy: {
      // Use system proxy: -1 (enabled), 2 (disabled), 1 (custom proxy)
      type: 2,
      // Prioritize HTTP PROXY, HTTPS PROXY, NO PROXY system env vars. Yes: 1 / No: -1
      envfirst: -1,
      // Proxy Bypass, pass as array with newlines
      bypass: [],
      // Protocol types
      protocols: [],
      auth: {
        // Whether to enable authentication
        authenticate: -1,
        // Proxy server host
        host: "",
        // Authentication username
        username: "",
        // Authentication password
        password: "",
      },
    },
    // CA certificate parameter handling
    ca_cert: {
      base64: "",
      open: -1,
      path: "",
    },
    // Client certificate parameter handling
    client_cert: {},
  };

  // Parent directory related parameters
  if (collection) {
    options.collection = collection;
  }

  return options;
};
