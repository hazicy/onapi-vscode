import type * as vscode from "vscode";
import type { RequestPanelCommand } from "@onapi/contracts/request-panel";
import {
  configuredVariableValues,
  createVariableContext,
} from "@onapi/domain/variables/context";
import { resolveVariables } from "@onapi/domain/variables/resolve";
import { getCurrentProjectConfig } from "../../../platform/storage/project-config";
import { applySocketSettings } from "./socket-settings";
import { getApiList } from "../request-storage";
import type { SysConfig } from "@onapi/domain/settings/types/settings";

type Executable = Extract<
  RequestPanelCommand,
  { action: "ai_send" | "mcp_connect" | "mcp_request" }
>;
export function prepareProtocolRequest(
  message: Executable,
  context: vscode.ExtensionContext,
  systemProxy: string,
) {
  const project = getCurrentProjectConfig(context);
  const http = project.http;
  const variables: Record<string, unknown> = http
    ? configuredVariableValues(createVariableContext(http))
    : {};
  // Collection folders override collection/global values; environment remains highest priority.
  const records = getApiList(context);
  let current = records.find((record) => record.id === message.data.id);
  const parents = [];
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    parents.unshift(current);
    current = records.find((record) => record.id === current!.parentId);
  }
  for (const parent of parents) {
    if (!Array.isArray(parent.variable)) {
      continue;
    }
    for (const entry of parent.variable) {
      if (entry.key && !entry.disabled) {
        variables[entry.key] = entry.value;
      }
    }
  }
  const env = http?.environments.find(
    (env) => env.id === http.activeEnvironment,
  );
  for (const entry of env?.values ?? []) {
    if (entry.key && !entry.disabled) {
      variables[entry.key] = entry.value;
    }
  }
  const resolved = resolveVariables(message, variables);
  if (
    resolved.action === "ai_send" ||
    (resolved.action === "mcp_connect" &&
      resolved.data.config.transport !== "stdio")
  ) {
    const url = new URL(resolved.data.url);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Server URL must use HTTP or HTTPS");
    }
  }
  if (resolved.action === "ai_send" && !resolved.data.config.model.trim()) {
    throw new Error("Model is required");
  }
  if (
    resolved.action === "mcp_connect" &&
    resolved.data.config.transport === "stdio" &&
    !resolved.data.config.command.trim()
  ) {
    throw new Error("MCP command is required");
  }
  const settings = context.globalState.get<SysConfig>("systemConfig") ?? {};
  const options = applySocketSettings({}, settings, systemProxy);
  return {
    message: resolved,
    network: {
      systemProxy: options.systemProxy,
      system_configs: { proxy: options.system_configs?.proxy },
    },
  };
}
