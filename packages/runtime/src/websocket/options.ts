import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { HttpsProxyAgent } from "https-proxy-agent";
import { minimatch } from "minimatch";
import type { ClientOptions } from "ws";

type Parameter = {
  key?: unknown;
  value?: unknown;
  is_checked?: number;
  is_system?: number;
};
type Parameters = Partial<
  Record<"header" | "query" | "cookie", { parameter?: Parameter[] }>
>;
export interface WebSocketTarget {
  id?: string;
  parentId?: string;
  url?: string;
  request?: Parameters & { url?: string };
  config?: {
    information_size?: number;
    shake_hands_timeout?: number;
    certificate_verification?: number;
  };
}
export interface WebSocketRuntimeOptions {
  globals?: Record<string, unknown>;
  env?: { environment?: Record<string, unknown>; env_pre_url?: string };
  project?: { request?: Parameters };
  collection?: WebSocketTarget[];
  language?: string;
  custom_functions?: Record<string, unknown>;
  systemProxy?: string;
  system_configs?: {
    certificate_verification?: number;
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
    ca_cert?: { open?: number; path?: string; base64?: string };
    client_cert?: Record<
      string,
      {
        password?: string;
        host?: string;
        port?: number;
        crt?: { file_url?: string; file_base64?: string };
        key?: { file_url?: string; file_base64?: string };
        pfx?: { file_url?: string; file_base64?: string };
      }
    >;
  };
}

export async function createVariableReplacer(options: WebSocketRuntimeOptions) {
  // Generate only the values actually referenced, rather than every Faker locale.
  const variables: Record<string, unknown> = {
    $timestamp: Math.floor(Date.now() / 1000),
    $microTimestamp: Date.now(),
    $randomInt: Math.floor(Math.random() * 1000),
    $randomFloat: Math.random() * 1000,
    $guid: randomUUID(),
    ...options.globals,
    ...options.env?.environment,
  };
  return async (value: unknown): Promise<string> => {
    let text = String(value ?? "");
    const expressions = text.match(/{{([^}]+)}}/g) || [];
    if (!expressions.length) {
      return text;
    }
    const language =
      options.language === "zh-hant" ? "zh-tw" : options.language || "en";
    for (const expression of expressions) {
      const key = expression.slice(2, -2);
      let result = variables[key];
      if (!Object.prototype.hasOwnProperty.call(variables, key)) {
        try {
          const { mockExp } = await import("@onapi/domain/mock/expressions");
          result = mockExp(
            expression,
            variables,
            language,
            options.custom_functions || {},
          );
        } catch {
          result = expression;
        }
      }
      if (result !== undefined) {
        text = text.replace(expression, () => String(result));
      }
    }
    return text;
  };
}

function inheritedParameters(
  target: WebSocketTarget,
  options: WebSocketRuntimeOptions,
  type: keyof Parameters,
) {
  const result = [...(target.request?.[type]?.parameter || [])];
  const visited = new Set<string>();
  let parent = target.parentId;
  while (parent && !visited.has(parent)) {
    visited.add(parent);
    const folder = options.collection?.find((item) => item.id === parent);
    const parameters =
      parent === "0"
        ? options.project?.request?.[type]?.parameter?.filter(
            (item) => !item.is_system || item.is_system < 1,
          )
        : folder?.request?.[type]?.parameter;
    for (const parameter of parameters || []) {
      if (
        !result.some((item) =>
          type === "header"
            ? String(item.key).toLowerCase() ===
              String(parameter.key).toLowerCase()
            : item.key === parameter.key,
        )
      ) {
        result.push(parameter);
      }
    }
    parent = folder?.parentId;
  }
  return result;
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
    if (pattern.startsWith("./index")) {
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

function proxyUrl(url: URL, options: WebSocketRuntimeOptions) {
  const proxy = options.system_configs?.proxy;
  if (proxy?.type === 1) {
    const protocol = url.protocol === "wss:" ? "https" : "http";
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
    const fromEnv =
      url.protocol === "wss:"
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

async function certificate(base64?: string, file?: string) {
  if (base64) {
    return Buffer.from(
      base64.includes(",") ? base64.slice(base64.indexOf(",") + 1) : base64,
      "base64",
    );
  }
  if (file) {
    return readFile(file);
  }
}

export async function prepareWebSocket(
  target: WebSocketTarget,
  options: WebSocketRuntimeOptions,
) {
  const replace = await createVariableReplacer(options);
  let address = await replace(target.url || target.request?.url);
  const base = (await replace(options.env?.env_pre_url)).trim();
  if (base) {
    address = `${base.replace(/\/+$/, "")}/${address.replace(/^\/+/, "")}`;
  }
  if (
    /^[a-z][a-z\d+.-]*:\/\//i.test(address) &&
    !/^(?:wss?|https?):\/\//i.test(address)
  ) {
    throw new Error("Unsupported WebSocket URL protocol");
  }
  if (!/^(?:wss?|https?):\/\//i.test(address)) {
    address = `ws://${address}`;
  }
  const url = new URL(address);
  if (url.protocol === "http:") {
    url.protocol = "ws:";
  }
  if (url.protocol === "https:") {
    url.protocol = "wss:";
  }
  if (!["ws:", "wss:"].includes(url.protocol)) {
    throw new Error("Unsupported WebSocket URL protocol");
  }
  const query: Record<string, string> = {};
  const headers: Record<string, string> = {};
  for (const type of ["query", "header", "cookie"] as const) {
    for (const item of inheritedParameters(target, options, type)) {
      if (!(Number(item.is_checked) > 0)) {
        continue;
      }
      const key = (await replace(item.key)).trim();
      if (!key) {
        continue;
      }
      const value = await replace(item.value);
      if (type === "query") {
        url.searchParams.set(key, value);
        query[key] = value;
      } else if (type === "header") {
        headers[key.toLowerCase()] = value;
      } else {
        headers.cookie = [headers.cookie?.replace(/;$/, ""), `${key}=${value}`]
          .filter(Boolean)
          .join(";");
      }
    }
  }
  const config = target.config || {};
  const system = options.system_configs;
  const verify =
    config.certificate_verification ?? system?.certificate_verification ?? -1;
  const clientOptions: ClientOptions = {
    headers,
    rejectUnauthorized: verify > 0,
    maxPayload: Math.max(0, Number(config.information_size) || 0) * 1024 * 1024,
    handshakeTimeout: Math.max(0, Number(config.shake_hands_timeout) || 0),
    perMessageDeflate: false,
  };
  if (system?.ca_cert?.open && system.ca_cert.open > 0) {
    clientOptions.ca = await certificate(
      system.ca_cert.base64,
      system.ca_cert.path,
    );
  }
  for (const [pattern, cert] of Object.entries(system?.client_cert || {})) {
    const host = cert.host || pattern;
    let domain: URL;
    try {
      domain = new URL(host.includes("://") ? host : `https://${host}`);
    } catch {
      continue;
    }
    if (
      !minimatch(url.hostname, domain.hostname) ||
      String(cert.port || domain.port || "443") !==
        (url.port || (url.protocol === "wss:" ? "443" : "80"))
    ) {
      continue;
    }
    clientOptions.passphrase = cert.password;
    for (const [key, source] of [
      ["cert", cert.crt],
      ["key", cert.key],
      ["pfx", cert.pfx],
    ] as const) {
      if (source) {
        clientOptions[key] = await certificate(
          source.file_base64,
          source.file_url,
        );
      }
    }
    break;
  }
  const proxy = proxyUrl(url, options);
  if (proxy) {
    clientOptions.agent = new HttpsProxyAgent(proxy);
  }
  const protocols = (headers["sec-websocket-protocol"] || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  delete headers["sec-websocket-protocol"];
  return { url: url.toString(), query, headers, protocols, clientOptions };
}
