import type { HttpRequestItem } from "@onapi/http-model";
import type { ApiDetailsData } from "@onapi/http-model/requests/types/api";
import type { ShareInfoData } from "@onapi/http-model/sharing/types/share";
import type { wsConnect, wsSend } from "./transports/websocket";
import type {
  socketioConnect,
  socketioSend,
  socketioUpdateEvent,
} from "./transports/socketio";

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
  ws_connect: Parameters<typeof wsConnect>[0];
  ws_disconnect: string;
  ws_send: Parameters<typeof wsSend>[0];
  socketio_connect: Parameters<typeof socketioConnect>[0];
  socketio_disconnect: string;
  socketio_send: Parameters<typeof socketioSend>[0];
  socketio_update_event: Parameters<typeof socketioUpdateEvent>[0];
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
