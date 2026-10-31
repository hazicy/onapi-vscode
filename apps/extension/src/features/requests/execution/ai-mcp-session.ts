import type * as vscode from "vscode";
import type { NetworkOptions } from "@onapi/runtime/network/proxy";
import { AiAdapter } from "@onapi/runtime/ai/adapter";
import { McpAdapter, McpRequestAdapter } from "@onapi/runtime/mcp/adapter";
import type { RequestPanelCommand } from "@onapi/contracts/request-panel";
import { executionService } from "../../../platform/execution/service";
import { executionScopeFor } from "../../../platform/execution/owners";
import { relayExecutionEvent } from "../../../platform/execution/webview-relay";

export function initializeProtocolSession(panel: vscode.WebviewPanel) {
  executionScopeFor(panel);
}
export async function handleAiMcpCommand(
  message: RequestPanelCommand,
  panel: vscode.WebviewPanel,
  network?: NetworkOptions,
): Promise<boolean> {
  const scope = executionScopeFor(panel);
  if (scope.disposed) {
    return true;
  }
  const observe = (event: import("@onapi/contracts").ExecutionEnvelope) =>
    relayExecutionEvent(panel.webview, event);
  switch (message.action) {
    case "ai_stop":
      await scope.find(message.data.executionId)?.cancel();
      return true;
    case "ai_send": {
      const { id, ...request } = message.data;
      const adapter = new AiAdapter();
      const run = scope.reserve(`ai:${id}`, message.requestId, id, adapter);
      await run
        .execute(executionService, adapter, { ...request, network }, observe)
        .catch(() => {});
      return true;
    }
    case "mcp_connect": {
      const { id, ...request } = message.data;
      const adapter = new McpAdapter();
      const run = scope.reserve(`mcp:${id}`, message.requestId, id, adapter);
      void run
        .execute(executionService, adapter, { ...request, network }, observe)
        .catch(() => {});
      return true;
    }
    case "mcp_disconnect":
      await scope.stop(`mcp:${message.data.id}`);
      return true;
    case "mcp_request": {
      const connection = scope.adapter(`mcp:${message.data.id}`, McpAdapter);
      const adapter = new McpRequestAdapter(connection ?? new McpAdapter());
      const run = scope.reserve(
        `mcp-request:${message.data.id}`,
        message.requestId,
        message.data.id,
        adapter,
      );
      await run
        .execute(executionService, adapter, message.data.operation, observe)
        .catch(() => {});
      return true;
    }
    default:
      return false;
  }
}
