import { APIS_GRPC_PROTO_TYPE_ENUM } from "@onapi/domain/requests/constants/index";

import { CustomNumberBooleanType } from "@onapi/domain/types/common";
import {
  ApisBaseData,
  ApisBaseDataItem,
} from "@onapi/domain/requests/types/base";
import { ApisBaseRequestBody } from "@onapi/domain/requests/types/request";
import { BaseResponse } from "@onapi/domain/requests/types/response";

export interface GrpcDetailsData extends ApisBaseData {
  // Imported proto file collection
  protos: GrpcProtos[];
  // Description
  description: string;
  // Request body
  request: {
    description: string;
  };
}

export interface IncludesInfo {
  name: string;
  path: string;
  proto: string;
}

export interface GrpcProtos {
  url?: string;
  proto_id: string;
  proto_name: string;
  proto_content?: string;
  proto_path?: string;
  proto_is_cloud?: CustomNumberBooleanType;
  include_dirs?: string[];
  include_files?: string[];
  services: GrpcProtosServices[];
}

export interface GrpcProtosServices {
  service_id: string;
  service_name: string;
  methods: GrpcProtosServicesMethods[];
}

export interface GrpcProtosServicesMethods {
  grpc_method_id: string;
  name: string;
  url?: string;
  tls?: CustomNumberBooleanType;
  ssl?: CustomNumberBooleanType;
  request_stream?: CustomNumberBooleanType;
  response_stream?: CustomNumberBooleanType;
  reconnect_num?: number;
  request: GrpcProtosServicesMethodsRequest;
  response: Pick<BaseResponse, "example">;
}

export interface GrpcProtosServicesMethodsRequest {
  // header
  metadata: { parameter: Array<ApisBaseDataItem> };
  // body
  message: GrpcProtosServicesMethodsRequestMessage[];
}

export type GrpcProtosServicesMethodsRequestMessage = Pick<
  ApisBaseRequestBody,
  "raw" | "raw_parameter"
> & {
  param_id: string;
  name: string;
};

export type GrpcTreeItem = {
  id: string;
  parent: string;
  title: string;
  type: APIS_GRPC_PROTO_TYPE_ENUM;
  url?: string;
  proto_is_cloud?: CustomNumberBooleanType;
  request_stream?: CustomNumberBooleanType;
  response_stream?: CustomNumberBooleanType;
  children?: GrpcTreeItem[];
};
