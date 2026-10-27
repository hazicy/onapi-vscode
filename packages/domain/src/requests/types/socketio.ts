import { AnyObject } from "@onapi/domain/types/common";
import {
  ApisBaseData,
  ApisBaseDataItem,
} from "@onapi/domain/requests/types/base";

export interface SocketIoConfig {
  // Max reconnect attempts when connection drops unexpectedly
  reconnect_num: number;
  // Reconnect interval in milliseconds
  reconnect_time: number;
  // Server path to use during handshake
  shake_hands_path: string;
  // Connection timeout in ms, 0 means no timeout
  shake_hands_timeout: number;
  // Client version used when method is Socket.IO
  socket_version: string;
  certificate_verification: -1;
}
export interface MessageItem {
  param_id: string;
  name: string;
  request: {
    mode: any;
    raw: string;
    raw_parameter: Array<ApisBaseDataItem>;
    raw_schema: any;
  };
  response: {
    mode: any;
    raw: string;
    raw_parameter: Array<ApisBaseDataItem>;
    raw_schema: any;
  };
}
export interface SocketIoRequest {
  // Request header info
  header: { parameter: Array<ApisBaseDataItem> };
  // Request query info
  query: { parameter: Array<ApisBaseDataItem> };
  // API request URL
  event: { parameter: Array<ApisBaseDataItem> };
  cookie: { parameter: Array<ApisBaseDataItem> };
  // Description
}
export interface SocketIoDetailsData extends ApisBaseData {
  // Request method Raw,Socket.IO
  method: string;
  // Request parameters
  request: SocketIoRequest;
  message: Array<MessageItem>;
  active_id?: string;
  msg_data?: string;
  ack?: 1 | -1;
  // Socket config info
  config: SocketIoConfig;
  description: string;
  // Socket connection URL
  url: string;
  attribute_info: AnyObject;
  tags?: string[];
}

export type SocketIoComponentType = {
  apisData: SocketIoDetailsData;
  onApisDataChange: (data: SocketIoDetailsData) => void;
};
