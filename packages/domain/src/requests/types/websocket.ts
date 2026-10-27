import { AnyObject } from "@onapi/domain/types/common";
import { JSONSchemaObject } from "@onapi/domain/types/json-schema";
import {
  ApisBaseData,
  ApisBaseDataItem,
} from "@onapi/domain/requests/types/base";

export interface WebSocketConfig {
  // Max receivable content size in MB, 0 means unlimited
  information_size: number;
  // Max reconnect attempts when connection drops unexpectedly
  reconnect_num: number;
  // Reconnect interval in milliseconds
  reconnect_time: number;
  // Server path to use during handshake
  // Connection timeout in ms, 0 means no timeout
  shake_hands_timeout: number;
  certificate_verification: 1 | -1;
  // Backend event listener list
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
export interface WebSocketRequest {
  cookie?: { parameter: ApisBaseDataItem[] };
  // Request header info
  header: { parameter: Array<ApisBaseDataItem> };
  // Request query info
  query: { parameter: Array<ApisBaseDataItem> };
  // API request URL
  // Description
}
export interface WebSocketDetailsData extends ApisBaseData {
  // Request method Raw,Socket.IO
  method: string;
  // Request parameters
  request: WebSocketRequest;
  message: Array<MessageItem>;
  active_id?: string;
  // Socket config info
  config: WebSocketConfig;
  description: string;
  // Socket connection URL
  url: string;
  attribute_info: AnyObject;
  tags?: string[];
}

export type WebSocketComponentType = {
  apisData: WebSocketDetailsData;
  onApisDataChange: (data: WebSocketDetailsData) => void;
};
