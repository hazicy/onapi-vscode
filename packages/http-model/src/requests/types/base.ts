import {
  APIS_TARGET_TYPE_ENUM,
  DEFAULT_API_MARK_ENUM,
} from "@onapi/http-model/requests/constants/index";
import {
  CustomNumberBooleanType,
  HttpStatusCode,
} from "@onapi/http-model/types/common";

import { ApiDetailsData } from "@onapi/http-model/requests/types/api";
import { SampleGroupsDetailsData } from "@onapi/http-model/requests/types/api-sample";
import { DocDetailsData } from "@onapi/http-model/requests/types/doc";
import { FolderDetailsData } from "@onapi/http-model/requests/types/folder";
import { GrpcDetailsData } from "@onapi/http-model/requests/types/grpc";
import { SocketDetailsData } from "@onapi/http-model/requests/types/socket";
import { SocketServiceDetailsData } from "@onapi/http-model/requests/types/socket-service";
import { SSEDetailsData } from "@onapi/http-model/requests/types/sse";
import { WebSocketDetailsData } from "@onapi/http-model/requests/types/websocket";
import { SocketIoDetailsData } from "@onapi/http-model/requests/types/socketio";
import { GraphQLDetailsData } from "@onapi/http-model/requests/types/graphql";

// API request method
export type ApiTypeMethod =
  | "POST"
  | "GET"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "COPY"
  | "HEAD"
  | "OPTIONS"
  | "LINK"
  | "UNLINK"
  | "PURGE"
  | "LOCK"
  | "UNLOCK"
  | "PROPFIND"
  | "VIEW";

export interface ApisBaseData {
  // Parent directory ID
  parentId: string;
  // Project ID
  project_id: string;
  // Collection unique ID
  id: string;
  // Data type: api, folder, doc, websocket
  kind: APIS_TARGET_TYPE_ENUM;
  // API/directory/text/websocket name
  name: string;
  // Sort order in left directory, higher = later, starting from 0
  sort: number;
  // 1=Normal -1=Deleted -2 -99=Permanently deleted
  status: 1 | -1 | -2 | -99;
  // Request method
  method?: unknown;
  // Archived
  is_exampled?: CustomNumberBooleanType;
  // API status: 1=In Development, 2=Completed, 3=Needs Modification, other=custom
  mark_id?: DEFAULT_API_MARK_ENUM | string;
  // Version
  version: number;
  // Created at
  created_at?: string;
  // Updated at
  updated_at?: number;
  // Tags
  tags?: string[];
  // Created by
  created_user?: {
    uid: string;
    nick_name: string;
    portrait: string;
  };
  // Updated by
  updated_user?: {
    uid: string;
    nick_name: string;
    portrait: string;
  };

  // vscodeVersion
  vscode_version?: string;
}

export interface ApisBaseDataItem {
  schema?: any;
  // id
  param_id?: string;
  // Field data type
  field_type?: TypeFiledType;
  // Whether selected
  is_checked: CustomNumberBooleanType;
  // Field name
  key: string;
  // Whether empty value is not allowed
  not_null?: CustomNumberBooleanType;
  // Field value
  value?: string;
  // Field description
  description?: string;
  // form-data content-type
  content_type?: string;
  // File name
  file_name?: string;
  // Base64 file
  file_base64?: string;
  static?: boolean;
}

export type TypeFiledType =
  | "Object"
  | "Array"
  | "String"
  | "Number"
  | "Integer"
  | "Float"
  | "Double"
  | "File"
  | "Date"
  | "DateTime"
  | "TimeStamp"
  | "Boolean";

export interface ExpectItem {
  // Expect name
  name: string;
  // Whether default
  is_default: CustomNumberBooleanType;
  // HTTP status code
  code: HttpStatusCode | string;
  // Response content format
  content_type: "json" | "xml" | "html" | "binary";
  // Validation type
  verify_type: "schema";
  // json schema
  schema: SchemaObj | any;
}

export interface SchemaObj {
  raw: string;
  raw_parameter: any[];
  raw_schema: any;
}

export type ApisDataTypeMapping = {
  [APIS_TARGET_TYPE_ENUM.API]: ApiDetailsData;
  [APIS_TARGET_TYPE_ENUM.SSE]: SSEDetailsData;
  [APIS_TARGET_TYPE_ENUM.FOLDER]: FolderDetailsData;
  [APIS_TARGET_TYPE_ENUM.DOC]: DocDetailsData;
  [APIS_TARGET_TYPE_ENUM.GRPC]: GrpcDetailsData;
  [APIS_TARGET_TYPE_ENUM.API_SAMPLE]: Omit<
    ApiDetailsData,
    "description" | "attribute_info"
  >;
  [APIS_TARGET_TYPE_ENUM.API_SAMPLE_GROUP]: SampleGroupsDetailsData;
  [APIS_TARGET_TYPE_ENUM.SOCKET]: SocketServiceDetailsData;
  [APIS_TARGET_TYPE_ENUM.SOCKET_METHOD]: SocketDetailsData;
  [APIS_TARGET_TYPE_ENUM.WEBSOCKET]: WebSocketDetailsData;
  [APIS_TARGET_TYPE_ENUM.SOCKETIO]: SocketIoDetailsData;
  [APIS_TARGET_TYPE_ENUM.GRAPHQL]: GraphQLDetailsData;
};
