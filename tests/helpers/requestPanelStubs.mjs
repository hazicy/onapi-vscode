import load, { nativeDependency } from "./loadTypeScript.mjs";
const channel = await load(
  "apps/extension/src/platform/webviews/request-panel-channel.ts",
  nativeDependency,
);
import { unexpectedCall as unused } from "./unexpectedCall.mjs";

// Explicit boundaries shared by request-panel tests. These operations must not
// run while testing persistence or opening a request that no longer exists.
export const requestPanelStubs = {
  "../../platform/webviews/request-panel-channel": channel,
  "./request-panel-channel": channel,
  "./execution/http-runner": {
    getCodeHarRequest: unused,
    getResolvedCodeRequest: unused,
    sendApi: unused,
    reserveHttpExecution: unused,
    stopWorker: unused,
  },
  "./execution/websocket-session": {
    prepareWebSocketSessionOptions: unused,
    connectWebSocketSession: unused,
    disconnectWebSocketSession: unused,
    sendWebSocketMessage: unused,
  },
  "./execution/socketio-session": {
    prepareSocketIoSessionOptions: unused,
    connectSocketIoSession: unused,
    disconnectSocketIoSession: unused,
    sendSocketIoMessage: unused,
    updateSocketIoSubscriptions: unused,
  },
  "./graphql-schema": { fetchGraphQLSchema: unused },
  "./request-history": { recordRequestHistory: unused },
  "../../platform/execution/webview-relay": { relayExecutionEvent: unused },
  "../../platform/http-client": { proxyFetch: unused },
  "../sharing/share-data": {
    createShare: unused,
    deleteShare: unused,
    getOpenApi: unused,
    getProjectShareData: unused,
    setProjectShareData: unused,
  },
  "../requests/commands": { updateOpenData: unused },
  "../requests/execution/http-runner": { getExecutionCollection: unused },
  "../sidebar/protocol-icon": { getProtocolIcon: unused },
  "./request-status": { setRequestDraft: unused },
  "../../platform/storage/events": { storageChanged: { fire: unused } },
  "../../platform/storage": { getStorageFilePath: unused },
  "../curl/import-curl": { curlImport: unused },
  "@onapi/api-converter/export": { importMethod: {} },
};
