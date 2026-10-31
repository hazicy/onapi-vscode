import * as vscode from "vscode";
import { GrpcAdapter } from "@onapi/runtime/grpc/adapter";
import type { RequestPanelCommand } from "@onapi/contracts/request-panel";
import { executionService } from "../../../platform/execution/service";
import { relayExecutionEvent } from "../../../platform/execution/webview-relay";
import { postRequestPanelResponse } from "../../../platform/webviews/request-panel-channel";
import { prepareProtocolRequest } from "./prepare-protocol-request";
import { recordRequestHistory } from "../request-history";
import type { RequestDocument } from "../request-document";

type Run = { targetId: string; adapter: GrpcAdapter };
type Session = { disposed: boolean; runs: Map<string, Run> };
const sessions = new WeakMap<vscode.WebviewPanel, Session>();
function session(panel: vscode.WebviewPanel) {
  let state = sessions.get(panel);
  if (!state) {
    state = { disposed: false, runs: new Map() };
    sessions.set(panel, state);
    panel.onDidDispose(() => {
      state!.disposed = true;
      for (const { adapter } of state!.runs.values()) {
        adapter.cancel();
      }
      state!.runs.clear();
    });
  }
  return state;
}
export async function handleGrpcCommand(
  message: RequestPanelCommand,
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
  document: RequestDocument,
) {
  const state = session(panel);
  if (state.disposed) {
    return;
  }
  switch (message.action) {
    case "grpc_import": {
      const paths = await vscode.window.showOpenDialog({
        title: message.data.directory
          ? "Import proto directory"
          : "Import Protocol Buffers",
        canSelectMany: !message.data.directory,
        canSelectFolders: !!message.data.directory,
        canSelectFiles: !message.data.directory,
        ...(!message.data.directory
          ? { filters: { "Protocol Buffers": ["proto"] } }
          : {}),
      });
      const { importProtoFiles, importProtoDirectory } =
        await import("@onapi/runtime/grpc/import");
      const files = !paths?.length
        ? []
        : message.data.directory
          ? await importProtoDirectory(paths[0].fsPath)
          : await importProtoFiles(paths.map((uri) => uri.fsPath));
      if (!state.disposed) {
        postRequestPanelResponse(panel.webview, {
          action: "grpcImported",
          requestId: message.requestId,
          data: { id: message.data.id, files },
        });
      }
      return;
    }
    case "grpc_cancel":
      state.runs.get(message.data.executionId)?.adapter.cancel();
      return;
    case "grpc_write": {
      const prepared = prepareProtocolRequest(message, context, "").message;
      if (prepared.action !== "grpc_write") {
        return;
      }
      const run = state.runs.get(message.data.executionId);
      if (!run || run.targetId !== message.data.id) {
        throw new Error("The gRPC call is no longer active");
      }
      run.adapter.write(prepared.data.message);
      return;
    }
    case "grpc_end": {
      const run = state.runs.get(message.data.executionId);
      if (!run) {
        throw new Error("The gRPC call is no longer active");
      }
      run.adapter.end();
      return;
    }
    case "grpc_invoke":
    case "grpc_discover": {
      const prepared = prepareProtocolRequest(message, context, "").message;
      if (
        prepared.action !== "grpc_invoke" &&
        prepared.action !== "grpc_discover"
      ) {
        return;
      }
      for (const run of state.runs.values()) {
        if (run.targetId === message.data.id) {
          run.adapter.cancel();
        }
      }
      const adapter = new GrpcAdapter(
        message.action === "grpc_discover" ? "discover" : "invoke",
      );
      state.runs.set(message.requestId, { targetId: message.data.id, adapter });
      const current = () =>
        !state.disposed &&
        state.runs.get(message.requestId)?.adapter === adapter;
      try {
        if (message.action === "grpc_invoke") {
          await recordRequestHistory(context, document.draft);
        }
        if (!current()) {
          return;
        }
        await executionService
          .execute(adapter, prepared.data, {
            sessionId: message.requestId,
            targetId: message.data.id,
            observer: (event) => {
              if (current()) {
                relayExecutionEvent(panel.webview, event);
              }
            },
          })
          .catch(() => {
            /* The core publishes SDK failures and the terminal lifecycle. */
          });
      } finally {
        if (state.runs.get(message.requestId)?.adapter === adapter) {
          state.runs.delete(message.requestId);
        }
      }
    }
  }
}
