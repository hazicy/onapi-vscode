import type * as vscode from "vscode";
import type { RequestPanelCommand } from "@onapi/contracts/request-panel";
import { createRequestExecutionContext } from "./execution-context";

type Executable = Extract<
  RequestPanelCommand,
  { action: "ai_send" | "mcp_connect" | "mcp_request" | "grpc_write" }
>;
export function prepareProtocolRequest(
  message: Executable,
  context: vscode.ExtensionContext,
  systemProxy: string,
) {
  const snapshot = createRequestExecutionContext(
    context,
    message.data.id,
    systemProxy,
  );
  const resolved = {
    ...message,
    data: { ...snapshot.resolve(message.data), id: message.data.id },
  } as Executable;
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
  return { message: resolved, network: snapshot.network };
}
