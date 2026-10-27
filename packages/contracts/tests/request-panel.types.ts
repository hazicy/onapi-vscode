import type {
  RequestPanelCommandInput,
  RequestPanelResponseInput,
} from "../src/request-panel/index";

declare function send(message: RequestPanelCommandInput): void;
declare function reply(message: RequestPanelResponseInput): void;

// Named SDK/editor interfaces do not need an artificial string index signature.
interface EditorRequest {
  id: string;
  parentId: string;
  name: string;
  kind: "api";
  request: { method: string; url: { host: string[] }; body: { raw: string } };
  editorExtension: { enabled: boolean };
}
declare const editorRequest: EditorRequest;

// This function is never executed; tsc checks the public transport API in CI.
export function checkRequestPanelTypes() {
  send({ action: "getApiList" });
  send({ action: "saveApiData", data: editorRequest });
  send({ action: "sendApi", executionId: "run", data: editorRequest });
  reply({ action: "setApiData", data: editorRequest });
  // @ts-expect-error Known payload fields retain their schema types.
  send({ action: "ws_send", data: { id: "socket", type: 123 } });
  send({ action: "stopSendApi", executionId: "run" });
  // @ts-expect-error Unknown command.
  send({ action: "saveApiDtaa", data: {} });
  // @ts-expect-error Cancellation must identify the execution.
  send({ action: "stopSendApi" });
  // @ts-expect-error Request data must have its required identity fields.
  send({ action: "saveApiData", data: { id: "request" } });
  // @ts-expect-error Message envelopes reject accidental fields.
  send({ action: "getApiList", typo: true });
  // @ts-expect-error Successful code generation needs the complete result.
  reply({ action: "generatedCode", data: { requestId: "one", code: "curl" } });
}
