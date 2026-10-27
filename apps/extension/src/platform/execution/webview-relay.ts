import {
  PROTOCOL_EXECUTION_EVENT,
  type ExecutionEnvelope,
} from "@onapi/contracts";

export interface ExecutionEventTarget {
  postMessage(message: unknown): unknown;
}

/** Only the host selects the destination and crosses the Webview boundary. */
export function relayExecutionEvent(
  target: ExecutionEventTarget,
  event: ExecutionEnvelope,
) {
  return target.postMessage({ action: PROTOCOL_EXECUTION_EVENT, data: event });
}
