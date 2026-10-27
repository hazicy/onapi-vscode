import type { SysConfig } from "@onapi/domain/settings/types/settings";
import type { WebSocketRuntimeOptions } from "@onapi/runtime/websocket/options";

/** Apply the shared proxy and certificate settings to either socket protocol. */
export function applySocketSettings(
  options: WebSocketRuntimeOptions,
  config: Partial<SysConfig>,
  systemProxy = "",
): WebSocketRuntimeOptions {
  let proxyHost = config.request_proxy_url || "";
  if (config.proxy === 3 && proxyHost && config.request_proxy_port) {
    try {
      const url = new URL(
        proxyHost.includes("://") ? proxyHost : `http://${proxyHost}`,
      );
      url.port = String(config.request_proxy_port);
      proxyHost = url.toString();
    } catch {
      // Report invalid active proxy settings through the connection error path.
      proxyHost = `${proxyHost}:${config.request_proxy_port}`;
    }
  }
  return {
    ...options,
    language: config.language,
    systemProxy,
    system_configs: {
      ...options.system_configs,
      proxy: {
        type: config.proxy === 3 ? 1 : config.proxy === 1 ? -1 : 2,
        envfirst: config.request_proxy_sys_open,
        bypass: config.request_proxy_bypass,
        protocols: config.request_proxy_type,
        auth: {
          host: proxyHost,
          authenticate: config.request_proxy_auth_open,
          username: config.request_proxy_auth?.request_proxy_auth_username,
          password: config.request_proxy_auth?.request_proxy_auth_password,
        },
      },
      ca_cert: {
        open: config.ca_certificate?.open,
        path: config.ca_certificate?.file_url,
        base64: config.ca_certificate?.file_base64,
      },
      client_cert: config.client_certificate,
    },
  };
}
