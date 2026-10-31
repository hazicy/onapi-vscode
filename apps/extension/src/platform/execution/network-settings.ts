import type { SysConfig } from "@onapi/domain/settings/types/settings";
import type { NetworkOptions } from "@onapi/runtime/network/proxy";

/** Translate application policy once; each transport consumes its own runtime options. */
export function networkFromSettings(
  config: Partial<SysConfig>,
  systemProxy = "",
): NetworkOptions {
  let host = config.request_proxy_url || "";
  if (config.proxy === 3 && host && config.request_proxy_port) {
    const url = new URL(host.includes("://") ? host : `http://${host}`);
    url.port = String(config.request_proxy_port);
    host = url.toString();
  }
  return {
    systemProxy,
    system_configs: {
      proxy: {
        type: config.proxy === 3 ? 1 : config.proxy === 1 ? -1 : 2,
        envfirst: config.request_proxy_sys_open,
        bypass: config.request_proxy_bypass,
        protocols: config.request_proxy_type,
        auth: {
          host,
          authenticate: config.request_proxy_auth_open,
          username: config.request_proxy_auth?.request_proxy_auth_username,
          password: config.request_proxy_auth?.request_proxy_auth_password,
        },
      },
    },
  };
}
