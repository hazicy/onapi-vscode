import {
  requestPanelResponseSchema,
  type RequestPanelCommandInput,
  type RequestPanelResponse,
} from "@onapi/contracts/request-panel";

/** All request-panel commands share the contract checked by the host. */
export function sendRequestPanelMessage(
  message: RequestPanelCommandInput,
): string {
  const requestId = message.requestId ?? crypto.randomUUID();
  window.vscode.postMessage({ ...message, requestId });
  return requestId;
}

/** Ignore unrelated channels (e.g. OAuth popup messages) and invalid host data. */
export function readRequestPanelResponse(
  value: unknown,
): RequestPanelResponse | undefined {
  const result = requestPanelResponseSchema.safeParse(value);
  return result.success ? result.data : undefined;
}
