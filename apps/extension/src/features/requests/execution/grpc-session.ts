import { grpcEditorRecordSchema } from "@onapi/domain/requests/record";
import { createRequestExecutionContext } from "./execution-context";
import { executionScopeFor } from "../../../platform/execution/owners";
import * as vscode from "vscode";
import { GrpcAdapter } from "@onapi/runtime/grpc/adapter";
import type { RequestPanelCommand } from "@onapi/contracts/request-panel";
import { executionService } from "../../../platform/execution/service";
import { relayExecutionEvent } from "../../../platform/execution/webview-relay";
import { postRequestPanelResponse } from "../../../platform/webviews/request-panel-channel";
import { prepareProtocolRequest } from "./prepare-protocol-request";
import { recordRequestHistory } from "../request-history";
import type { RequestDocument } from "../request-document";

export async function handleGrpcCommand(
  message: RequestPanelCommand,
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
  document: RequestDocument,
) {
  const scope = executionScopeFor(panel, context);
  if (scope.disposed) {
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
      if (!scope.disposed) {
        postRequestPanelResponse(panel.webview, {
          action: "grpcImported",
          requestId: message.requestId,
          data: { id: message.data.id, files },
        });
      }
      return;
    }
    case "grpc_cancel":
      void scope.find(message.data.executionId)?.cancel();
      return;
    case "grpc_write": {
      const prepared = prepareProtocolRequest(message, context, "").message;
      if (prepared.action !== "grpc_write") {
        return;
      }
      const run = scope.find(message.data.executionId);
      if (!run || run.targetId !== message.data.id) {
        throw new Error("The gRPC call is no longer active");
      }
      if (!(run.adapter instanceof GrpcAdapter)) {
        throw new Error("The gRPC call is no longer active");
      }
      run.adapter.write(prepared.data.message);
      return;
    }
    case "grpc_end": {
      const run = scope.find(message.data.executionId);
      if (!run) {
        throw new Error("The gRPC call is no longer active");
      }
      if (!(run.adapter instanceof GrpcAdapter)) {
        throw new Error("The gRPC call is no longer active");
      }
      run.adapter.end();
      return;
    }
    case "grpc_invoke":
    case "grpc_discover": {
      const record = grpcEditorRecordSchema.parse(document.draft);
      if (record.id !== message.data.id) {
        throw new Error("Request identity does not match this editor");
      }
      const snapshot = createRequestExecutionContext(context, record.id);
      const { definition, ...config } = snapshot.resolve(record.grpc);
      const adapter = new GrpcAdapter(
        message.action === "grpc_discover" ? "discover" : "invoke",
      );
      const run = scope.reserve(
        `grpc:${record.id}`,
        message.requestId,
        record.id,
        adapter,
      );
      try {
        if (message.action === "grpc_invoke") {
          await recordRequestHistory(context, document.draft);
        }
        await run
          .execute(
            executionService,
            adapter,
            {
              url: snapshot.resolve(record.url ?? ""),
              config,
              definition,
              refresh:
                message.action === "grpc_discover" && message.data.refresh,
            },
            (event) => relayExecutionEvent(panel.webview, event),
          )
          .catch(() => {});
      } finally {
        run.finish();
      }
    }
  }
}
