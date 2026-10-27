import { ApisBaseDataItem } from "@onapi/http-model/requests/types/base";

export type RequestBodyContentType =
  | "none"
  | "form-data"
  | "urlencoded"
  | "binary"
  | "json"
  | "xml"
  | "javascript"
  | "plain"
  | "html"
  | "msgpack";

export type ApisBaseRequestBody = {
  // Request body type, none，form-data,urlencoded,json,xml,javascript,plain,html
  mode: RequestBodyContentType;
  // Valid when mode is form-data or urlencoded
  parameter?: Array<ApisBaseDataItem>;
  // Valid when mode is json, xml, javascript, plain, html
  raw: string;
  // Valid when mode is json, xml, javascript, plain, html
  raw_parameter: Array<ApisBaseDataItem>;
  raw_schema: object;
  binary?: {
    file_name: string;
    data_url: string;
    file_path?: string;
  } | null;
};

export interface SocketRequestBody {
  //Parameter type
  mode:
    | "iso8583"
    | "json"
    | "xml"
    | "raw"
    | "fixed_message"
    | "delimiter_message";
  //  Use this data for iso8583 type parameters
  parameter: any[];
  //  'json' | 'xml' | 'raw' Use this data for
  raw: string;
  raw_parameter: any[];
  raw_schema: any;
}

export interface SocketRequestFunc {
  id: string; //Function ID
  title: string; //Function display title
  option: any; // Function definition, may be object or text
}

export interface SocketRequest {
  // Request body info
  body: SocketRequestBody;
  // Post-response operations
  post_tasks: any[];
  //Send settings info
  configs: {
    charset: string;
    func: {
      request: SocketRequestFunc[];
      response: SocketRequestFunc[];
    };
  };
}

export type DefaultRequestSystemHeaders = {
  key: string;
  value: string;
  is_checked: 1 | -1;
  field_type: string;
};
