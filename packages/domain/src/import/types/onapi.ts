import type {
  GlobalParamsHeaderItem,
  GlobalParamsTypeItem,
  GlobalParamsCookieItem,
} from "@onapi/domain/project/types/index";
import { APIS_TASK_TYPES_ENUM } from "@onapi/domain/requests/constants/index";
// Onapi file-format definitions. Conversion happens at import/export boundaries.
import type { ApiMetadata } from "@onapi/domain/requests/types/api";
import type {
  ApiTypeMethod,
  ApisBaseDataItem,
} from "@onapi/domain/requests/types/base";
import type { ApisBaseRequestBody } from "@onapi/domain/requests/types/request";
import type { CustomNumberBooleanType } from "@onapi/domain/types/common";
import type { BaseResponse } from "@onapi/domain/requests/types/response";
import type { Auth } from "@onapi/domain/requests/types/auth";

/** Onapi external document. */
export interface OnapiDocument extends ApiMetadata {
  method: ApiTypeMethod;
  url: string;
  description: string;
  request: OnapiRequest;
  response: BaseResponse;
}

export interface OnapiRequest {
  auth?: Auth;
  body?: ApisBaseRequestBody;
  // Request header info
  header?: { parameter: Array<ApisBaseDataItem> };
  // Request query info
  query?: {
    parameter: Array<ApisBaseDataItem>;
    // Whether to add equals sign to query parameters
    query_add_equal?: CustomNumberBooleanType;
  };
  // Request cookie info
  cookie?: { parameter: Array<ApisBaseDataItem> };
  // Request path variable info
  restful?: { parameter: Array<ApisBaseDataItem> };
  // Pre-request operations
  pre_tasks?: OnapiTask[];
  // Post-response operations
  post_tasks?: OnapiTask[];
  // Protocol
  protocol?: string;
  // Request tab default active key (temporary field, not accepted by backend)
  tabs_default_active_key?: string;
}

export interface OnapiGraphQLRequest {
  // Request auth info
  auth?: Auth;
  // Request header info
  header: { parameter: Array<ApisBaseDataItem> };
  // Pre-request operations
  pre_tasks: OnapiTask[];
  // Post-response operations
  post_tasks: OnapiTask[];
  // Request body info
  body: OnapiGraphQLBody;
  cookie: { parameter: Array<ApisBaseDataItem> };
}

export type OnapiGlobalParams = {
  header: {
    parameter: GlobalParamsHeaderItem[];
  };
  query: {
    parameter: GlobalParamsTypeItem[];
  };
  body: {
    parameter: GlobalParamsTypeItem[];
  };
  cookie: {
    parameter: GlobalParamsCookieItem[];
  };
  restful: {
    parameter: GlobalParamsCookieItem[];
  };
  auth: Auth;
  // script: GlobalParamsScriptItem;
  pre_tasks: OnapiTask[];
  post_tasks: OnapiTask[];
};

export type OnapiTask = {
  type: APIS_TASK_TYPES_ENUM;
  id: string;
  enabled: CustomNumberBooleanType;
  name: string;
  data: any;
};

export type OnapiGraphQLQuery = {
  // id
  param_id: string;
  // Field name
  name: string;
  // Request body
  query: string;
  // Variables
  variables: string;
  // Response
  response: {
    mode: any;
    raw: string;
    raw_parameter: Array<ApisBaseDataItem>;
    raw_schema: any;
  };
};

export type OnapiGraphQLBody = {
  query_schema: object;
  query_list: Array<OnapiGraphQLQuery>;
};
