import { EventEmitter } from "vscode";
import type { ApiDetailsData } from "@onapi/domain/requests/types/api";
import {
  isHttpCollectionItem,
  requestUrl,
  createDefaultHttpConfig,
} from "@onapi/domain";

export const requestStatusChanged = new EventEmitter<void>();
type Result = { badge: string; color: string; message: string };
const workspaces = new Map<
  string,
  Map<string, { draft?: ApiDetailsData; result?: Result }>
>();
const entry = (workspace: string, id: string) => {
  let items = workspaces.get(workspace);
  if (!items) {
    workspaces.set(workspace, (items = new Map()));
  }
  let state = items.get(id);
  if (!state) {
    items.set(id, (state = {}));
  }
  return state;
};
export function setRequestDraft(
  workspace: string,
  id: string,
  draft?: ApiDetailsData,
) {
  entry(workspace, id).draft = draft;
  requestStatusChanged.fire();
}
export function setRequestResult(
  workspace: string,
  id: string,
  response: any,
  error?: any,
) {
  const message = String(error?.message || error?.code || error || "");
  const timeout = /timeout|timed\s*out|ETIMEDOUT|超时/i.test(message);
  const code = Number(response?.code);
  const failed = !!error || !code || code >= 400;
  entry(workspace, id).result = {
    badge: timeout ? "T" : failed ? "!" : "✓",
    color: timeout
      ? "list.warningForeground"
      : failed
        ? "list.errorForeground"
        : "testing.iconPassed",
    message: timeout
      ? `请求超时 / Request timed out: ${message}`
      : failed
        ? `请求失败 / Request failed: ${message || code || "No response"}`
        : `请求成功 / Request succeeded: HTTP ${code}`,
  };
  requestStatusChanged.fire();
}

/** Evaluate only executable request fields; response examples and documentation are excluded. */
export function requestDecoration(
  workspace: string,
  saved: ApiDetailsData,
  config: any,
  rows: ApiDetailsData[],
) {
  if (
    !["api", "graphql", "sse", "websocket", "socketio"].includes(saved.kind)
  ) {
    return;
  }
  const state = workspaces.get(workspace)?.get(saved.id);
  const data = state?.draft || saved;
  const native = isHttpCollectionItem(data);
  const settings = config?.http || createDefaultHttpConfig();
  const errors: string[] = [];
  const fields: string[] = [native ? requestUrl(data) : data.url || ""];
  const env = native
    ? settings.environments.find(
        (scope: any) => scope.id === settings.activeEnvironment,
      )
    : config?.envList?.find(
        (item: any) => item.env_id === config.envDetailKeys,
      );
  const variables = native
    ? Object.fromEntries(
        [
          ...(settings.collection.variable || []),
          ...(settings.options.globals.values || []),
          ...(env?.values || []),
        ]
          .filter((entry: any) => entry.enabled !== false && !entry.disabled)
          .map((entry: any) => [entry.key, entry]),
      )
    : { ...config?.globalVars, ...env?.env_var_list };
  let serverId = config?.serverList?.find(
    (item: any) => item.is_default === 1,
  )?.server_id;
  const ancestors: any[] = [];
  const seen = new Set<string>();
  let current: any = data;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    ancestors.push(current);
    current = rows.find((row) => row.id === current.parentId);
  }
  serverId =
    ancestors.find((row) => row.server_id && row.server_id !== "0")
      ?.server_id || serverId;
  const base =
    env?.server_list?.find((item: any) => item.server_id === serverId)?.uri ||
    "";
  fields.push(base);
  if (!(native ? requestUrl(data) : data.url)?.trim() && !base.trim()) {
    errors.push("缺少 URL / Missing URL");
  }
  for (const request of [
    config?.globalParams,
    ...ancestors.map((row) => row.request),
  ]) {
    if (!request) {
      continue;
    }
    if (native) {
      const body = request.body;
      const parameters = [
        ...(Array.isArray(request.header) ? request.header : []),
        ...(request.url?.query || []),
        ...(request.url?.variable || []),
        ...(["formdata", "urlencoded"].includes(body?.mode)
          ? body[body.mode] || []
          : []),
      ];
      for (const parameter of parameters) {
        if (parameter.disabled || (!parameter.key && !parameter.value)) {
          continue;
        }
        if (!String(parameter.key || "").trim()) {
          errors.push("参数名为空 / Empty parameter name");
        }
        fields.push(
          String(parameter.key || ""),
          String(parameter.value ?? parameter.src ?? ""),
        );
      }
      if (body?.mode === "raw") {
        fields.push(body.raw || "");
        if (
          body.options?.raw?.language === "json" &&
          body.raw?.trim() &&
          !body.raw.includes("{{")
        ) {
          try {
            JSON.parse(body.raw);
          } catch {
            errors.push("JSON 请求体格式错误 / Invalid JSON body");
          }
        }
      }
      if (body?.mode === "graphql") {
        fields.push(JSON.stringify(body.graphql));
      }
      if (request.auth) {
        fields.push(JSON.stringify(request.auth));
      }
      continue;
    }
    for (const section of ["header", "query", "cookie", "restful", "body"]) {
      if (
        section === "body" &&
        request.body?.mode &&
        !["form-data", "urlencoded"].includes(request.body.mode)
      ) {
        continue;
      }
      for (const parameter of request[section]?.parameter || []) {
        if (parameter.is_checked === -1) {
          continue;
        }
        if (!parameter.key && !parameter.value) {
          continue;
        } // Editor's empty placeholder row.
        if (!String(parameter.key || "").trim()) {
          errors.push("参数名为空 / Empty parameter name");
        }
        fields.push(String(parameter.key || ""), String(parameter.value ?? ""));
      }
    }
    if (
      request.body?.raw &&
      !["none", "binary", "form-data", "urlencoded"].includes(request.body.mode)
    ) {
      fields.push(request.body.raw);
    }
    if (
      request === data.request &&
      request.body?.mode === "json" &&
      request.body.raw?.trim() &&
      !request.body.raw.includes("{{")
    ) {
      try {
        JSON.parse(request.body.raw);
      } catch {
        errors.push("JSON 请求体格式错误 / Invalid JSON body");
      }
    }
    if (request.auth) {
      fields.push(JSON.stringify(request.auth));
    }
  }
  const missing = new Set<string>();
  const checked = new Set<string>();
  const inspect = (value: string) => {
    for (const match of value.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)) {
      const name = (native ? match[1] : match[1].split("|")[0]).trim();
      if ((native ? /^[$]/ : /^[$@'"]/).test(name) || checked.has(name)) {
        continue;
      }
      checked.add(name);
      const variable = variables[name];
      const resolved = variable?.current_value ?? variable?.value;
      if (resolved === undefined || resolved === null) {
        missing.add(name);
      } else {
        inspect(String(resolved));
      }
    }
  };
  fields.forEach(inspect);
  const statuses: Result[] = [];
  if (errors.length) {
    statuses.push({
      badge: "!",
      color: "list.errorForeground",
      message: [...new Set(errors)].join("\n"),
    });
  }
  if (missing.size) {
    statuses.push({
      badge: "E",
      color: "list.warningForeground",
      message: `缺少变量 / Missing variables: ${[...missing].join(", ")}`,
    });
  }
  if (state?.draft) {
    statuses.push({
      badge: "M",
      color: "list.warningForeground",
      message: "有未保存的修改 / Unsaved changes",
    });
  }
  if (state?.result) {
    statuses.push(state.result);
  }
  if (!statuses.length) {
    return;
  }
  return {
    badge: statuses[0].badge,
    color: statuses[0].color,
    tooltip: statuses.map((status) => status.message).join("\n"),
  };
}
