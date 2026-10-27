import type { HttpRequestItem } from "@onapi/domain";
import type { ApiDetailsData } from "@onapi/domain/requests/types/api";
import type { ShareInfoData } from "@onapi/domain/sharing/types/share";
import type {
  connectWebSocketSession,
  sendWebSocketMessage,
} from "./execution/websocket-session";
import type {
  connectSocketIoSession,
  sendSocketIoMessage,
  updateSocketIoSubscriptions,
} from "./execution/socketio-session";

type Payloads = {
  getVscodeTheme: undefined;
  getApiList: undefined;
  getProjectConfig: undefined;
  getSystemConfig: undefined;
  getDocBaseUrl: undefined;
  stopSendApi: undefined;
  saveApiData: ApiDetailsData;
  updateApiActiveData: ApiDetailsData;
  sendApi: HttpRequestItem;
  sendSse: HttpRequestItem;
  openNewWindow: string;
  openEnv: unknown;
  openTagPanelById: string;
  setProjectConfig: { key: string; value: unknown };
  setSystemConfig: Record<string, unknown>;
  createShare: ShareInfoData;
  getCodeHar: { apiData: HttpRequestItem };
  copyAsCurl: { apiData: HttpRequestItem };
  exportOpenApiById: { id: string };
  ws_connect: Parameters<typeof connectWebSocketSession>[0];
  ws_disconnect: string;
  ws_send: Parameters<typeof sendWebSocketMessage>[0];
  socketio_connect: Parameters<typeof connectSocketIoSession>[0];
  socketio_disconnect: string;
  socketio_send: Parameters<typeof sendSocketIoMessage>[0];
  socketio_update_event: Parameters<typeof updateSocketIoSubscriptions>[0];
  "/proxy/fetch": Record<string, unknown>;
  getGraphQLSchema: { apiData: HttpRequestItem; currentServerId?: string };
};

export type RequestPanelMessage = {
  [Action in keyof Payloads]: {
    action: Action;
    option?: unknown;
  } & (undefined extends Payloads[Action]
    ? { data?: Payloads[Action] }
    : { data: Payloads[Action] });
}[keyof Payloads];
