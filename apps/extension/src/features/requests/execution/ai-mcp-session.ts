import type * as vscode from "vscode";
import type { NetworkOptions } from "@onapi/runtime/network/proxy";
import { AiAdapter } from "@onapi/runtime/ai/adapter";
import { McpAdapter, McpRequestAdapter } from "@onapi/runtime/mcp/adapter";
import type { RequestPanelCommand } from "@onapi/contracts/request-panel";
import type { ProtocolAdapter } from "@onapi/core";
import { executionService } from "../../../platform/execution/service";
import { relayExecutionEvent } from "../../../platform/execution/webview-relay";

type Cancellable = Pick<ProtocolAdapter<unknown>, "cancel">;
type Connection = { adapter: McpAdapter; done: Promise<void> };
type Session = {
  runs: Map<string, Cancellable>;
  connections: Map<string, Connection>;
  disposed: boolean;
};
const sessions = new WeakMap<vscode.WebviewPanel, Session>();
function session(panel: vscode.WebviewPanel) {
  let state = sessions.get(panel);
  if (!state) {
    state = { runs: new Map(), connections: new Map(), disposed: false };
    sessions.set(panel, state);
    panel.onDidDispose(() => {
      state!.disposed = true;
      for (const adapter of state!.runs.values()) {
        void Promise.resolve(adapter.cancel()).catch(console.error);
      }
      for (const { adapter } of state!.connections.values()) {
        void adapter.cancel().catch(console.error);
      }
      state!.runs.clear();
      state!.connections.clear();
    });
  }
  return state;
}

export function initializeProtocolSession(panel: vscode.WebviewPanel) {
  session(panel);
}

/** The host owns panel scope; runtime adapters own SDKs and protocol behavior. */
export async function handleAiMcpCommand(
  message: RequestPanelCommand,
  panel: vscode.WebviewPanel,
  network?: NetworkOptions,
): Promise<boolean> {
  const state = session(panel);
  if (state.disposed) {
    return true;
  }
  switch (message.action) {
    case "ai_stop":
      await state.runs.get(message.data.executionId)?.cancel();
      return true;
    case "ai_send": {
      const { id, ...request } = message.data;
      const adapter = new AiAdapter();
      await state.runs.get(message.requestId)?.cancel();
      if (state.disposed) {
        return true;
      }
      state.runs.set(message.requestId, adapter);
      try {
        await executionService.execute(
          adapter,
          { ...request, network },
          {
            sessionId: message.requestId,
            targetId: id,
            observer: (event) => {
              if (
                !state.disposed &&
                state.runs.get(message.requestId) === adapter
              ) {
                relayExecutionEvent(panel.webview, event);
              }
            },
          },
        );
      } catch {
        /* ExecutionService published the failure and terminal lifecycle. */
      } finally {
        if (state.runs.get(message.requestId) === adapter) {
          state.runs.delete(message.requestId);
        }
      }
      return true;
    }
    case "mcp_connect": {
      const { id, ...request } = message.data;
      const previous = state.connections.get(id);
      // Register before any await: a replacement or disposal can cancel initialization.
      const adapter = new McpAdapter();
      const connection: Connection = { adapter, done: Promise.resolve() };
      state.connections.set(id, connection);
      const current = () =>
        !state.disposed && state.connections.get(id) === connection;
      connection.done = (async () => {
        await previous?.adapter.cancel();
        if (!current()) {
          await adapter.cancel();
          return;
        }
        await executionService.execute(
          adapter,
          { ...request, network },
          {
            sessionId: message.requestId,
            targetId: id,
            observer: (event) => {
              if (current()) {
                relayExecutionEvent(panel.webview, event);
              }
            },
          },
        );
      })()
        .catch(() => {
          /* ExecutionService already published the error. */
        })
        .finally(() => {
          if (state.connections.get(id) === connection) {
            state.connections.delete(id);
          }
        });
      return true;
    }
    case "mcp_disconnect": {
      const connection = state.connections.get(message.data.id);
      await connection?.adapter.cancel();
      await connection?.done;
      return true;
    }
    case "mcp_request": {
      const connection = state.connections.get(message.data.id);
      // A disconnected request still runs through the core error lifecycle.
      const adapter = new McpRequestAdapter(
        connection?.adapter ?? new McpAdapter(),
      );
      state.runs.set(message.requestId, adapter);
      try {
        await executionService.execute(adapter, message.data.operation, {
          sessionId: message.requestId,
          targetId: message.data.id,
          observer: (event) => {
            if (
              !state.disposed &&
              state.runs.get(message.requestId) === adapter
            ) {
              relayExecutionEvent(panel.webview, event);
            }
          },
        });
      } catch {
        /* ExecutionService published the failure. */
      } finally {
        if (state.runs.get(message.requestId) === adapter) {
          state.runs.delete(message.requestId);
        }
      }
      return true;
    }
    default:
      return false;
  }
}
