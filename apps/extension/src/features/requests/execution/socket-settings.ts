import { networkFromSettings } from "../../../platform/execution/network-settings";
import type { SysConfig } from "@onapi/domain/settings/types/settings";
import type { WebSocketRuntimeOptions } from "@onapi/runtime/websocket/options";

/** Apply the shared proxy and certificate settings to either socket protocol. */
export function applySocketSettings(
  options: WebSocketRuntimeOptions,
  config: Partial<SysConfig>,
  systemProxy = "",
): WebSocketRuntimeOptions {
  const network = networkFromSettings(config, systemProxy);
  return {
    ...options,
    language: config.language,
    systemProxy,
    system_configs: {
      ...options.system_configs,
      proxy: network.system_configs?.proxy,
      ca_cert: {
        open: config.ca_certificate?.open,
        path: config.ca_certificate?.file_url,
        base64: config.ca_certificate?.file_base64,
      },
      client_cert: config.client_certificate,
    },
  };
}
