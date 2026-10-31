import { minimatch } from "minimatch";
export interface NetworkOptions {
  systemProxy?: string;
  system_configs?: {
    proxy?: {
      type?: number;
      envfirst?: number;
      bypass?: string[] | string;
      protocols?: string[] | string;
      auth?: {
        host?: string | (string | number)[];
        authenticate?: number;
        username?: string;
        password?: string;
      };
    };
  };
}
const list = (value?: string[] | string) =>
  (typeof value === "string" ? value.split(",") : value || [])
    .map((item) => item.trim())
    .filter(Boolean);
function bypasses(url: URL, value?: string[] | string) {
  return list(value).some((pattern) => {
    if (pattern === "*") {
      return true;
    }
    const host = url.hostname.toLowerCase();
    if (
      host === pattern.toLowerCase() ||
      url.host.toLowerCase() === pattern.toLowerCase()
    ) {
      return true;
    }
    if (pattern.startsWith(".")) {
      return (
        host === pattern.slice(1).toLowerCase() ||
        host.endsWith(pattern.toLowerCase())
      );
    }
    return (
      minimatch(host, pattern, { nocase: true }) ||
      minimatch(url.host, pattern, { nocase: true })
    );
  });
}

export function proxyUrl(url: URL, options: NetworkOptions) {
  const proxy = options.system_configs?.proxy;
  if (proxy?.type === 1) {
    const protocol = ["https:", "wss:"].includes(url.protocol)
      ? "https"
      : "http";
    if (
      bypasses(url, proxy.bypass) ||
      !list(proxy.protocols)
        .map((item) => item.toLowerCase())
        .includes(protocol)
    ) {
      return;
    }
    const host = Array.isArray(proxy.auth?.host)
      ? proxy.auth.host.join(":")
      : proxy.auth?.host;
    if (!host) {
      return;
    }
    const address = new URL(host.includes("://") ? host : `http://${host}`);
    if (proxy.auth?.authenticate && proxy.auth.authenticate > 0) {
      address.username = proxy.auth.username || "";
      address.password = proxy.auth.password || "";
    }
    return address;
  }
  if (proxy?.type === -1) {
    const env = process.env;
    if (bypasses(url, env.NO_PROXY || env.no_proxy)) {
      return;
    }
    const fromEnv = ["https:", "wss:"].includes(url.protocol)
      ? env.HTTPS_PROXY || env.https_proxy
      : env.HTTP_PROXY || env.http_proxy;
    const address =
      proxy.envfirst === 1
        ? fromEnv || options.systemProxy
        : options.systemProxy || fromEnv;
    if (address) {
      return new URL(address);
    }
  }
}
