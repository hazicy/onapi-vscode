import {
  readRequestPanelResponse,
  sendRequestPanelMessage,
} from "./request-panel";

const pending = new Map<string, (value?: string) => void>();
let listening = false;

/** Correlate concurrent editors and responses without installing a listener per call. */
export function formatWithOxfmt(
  source: string,
  language: string,
): Promise<string> {
  if (!listening) {
    window.addEventListener("message", (event) => {
      const response = readRequestPanelResponse(event.data);
      if (!response?.requestId) {
        return;
      }
      if (response.action === "documentFormatted") {
        pending.get(response.requestId)?.(response.data.value);
      } else if (response.action === "requestPanelError") {
        pending.get(response.requestId)?.();
      }
    });
    listening = true;
  }
  return new Promise((resolve) => {
    const requestId = crypto.randomUUID();
    const timeout = window.setTimeout(() => finish(source), 30000);
    const finish = (value = source) => {
      window.clearTimeout(timeout);
      pending.delete(requestId);
      resolve(value);
    };
    pending.set(requestId, finish);
    try {
      sendRequestPanelMessage({
        action: "formatDocument",
        requestId,
        data: { source, language },
      });
    } catch {
      finish(source);
    }
  });
}
