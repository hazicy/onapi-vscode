import { Worker } from "node:worker_threads";
import path from "node:path";
import type * as vscode from "vscode";
import { requestPanelCommandSchema } from "@onapi/contracts/request-panel";

export function registerFormatter(
  panel: vscode.WebviewPanel,
  context: vscode.ExtensionContext,
) {
  let worker: Worker | undefined;
  let disposed = false;
  let idle: ReturnType<typeof setTimeout> | undefined;
  const pending = new Map<string, string>();
  const reply = (requestId: string, value: string) => {
    pending.delete(requestId);
    if (!pending.size && !disposed) {
      clearTimeout(idle);
      idle = setTimeout(() => {
        const current = worker;
        worker = undefined;
        void current?.terminate();
      }, 30000);
    }
    if (!disposed) {
      void panel.webview.postMessage({
        action: "documentFormatted",
        requestId,
        data: { value },
      });
    }
  };
  const listener = panel.webview.onDidReceiveMessage((value: unknown) => {
    if (
      !value ||
      typeof value !== "object" ||
      !("action" in value) ||
      value.action !== "formatDocument"
    ) {
      return;
    }
    clearTimeout(idle);
    const parsed = requestPanelCommandSchema.safeParse(value);
    if (!parsed.success || parsed.data.action !== "formatDocument") {
      return;
    }
    const { requestId, data } = parsed.data;
    if (!requestId || disposed) {
      return;
    }
    pending.set(requestId, data.source);
    try {
      if (!worker) {
        const current = new Worker(
          path.join(context.extensionPath, "dist/formatter/worker.mjs"),
        );
        worker = current;
        current.on(
          "message",
          (result: { requestId: string; value: string }) => {
            if (pending.has(result.requestId)) {
              reply(result.requestId, result.value);
            }
          },
        );
        const fail = () => {
          if (worker !== current) {
            return;
          }
          worker = undefined;
          for (const [id, source] of pending) {
            reply(id, source);
          }
          void current.terminate();
        };
        current.on("error", fail);
        current.on("exit", fail);
      }
      worker.postMessage({ requestId, ...data });
    } catch {
      reply(requestId, data.source);
    }
  });
  panel.onDidDispose(() => {
    disposed = true;
    clearTimeout(idle);
    listener.dispose();
    pending.clear();
    void worker?.terminate();
    worker = undefined;
  });
}
