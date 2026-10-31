import { ProxyAgent } from "undici";
import { proxyUrl, type NetworkOptions } from "./proxy";

/** Reuse the same proxy selection and bypass policy as WebSocket. */
export function createNetworkClient(
  options?: NetworkOptions,
  baseFetch = globalThis.fetch,
) {
  const agents = new Map<string, ProxyAgent>();
  const fetch: typeof globalThis.fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string" || input instanceof URL ? input : input.url,
    );
    const proxy = options && proxyUrl(url, options);
    if (!proxy) {
      return baseFetch(input, init);
    }
    const key = proxy.href;
    let dispatcher = agents.get(key);
    if (!dispatcher) {
      dispatcher = new ProxyAgent(key);
      agents.set(key, dispatcher);
    }
    const settings = { ...init, dispatcher };
    return baseFetch(input, settings);
  };
  return {
    fetch,
    close: async () => {
      await Promise.all([...agents.values()].map((agent) => agent.destroy()));
      agents.clear();
    },
  };
}
