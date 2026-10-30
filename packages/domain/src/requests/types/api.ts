import {
  AnyObject,
  CompareCalcSymbols,
  CustomNumberBooleanType,
} from "@onapi/domain/types/common";
import { ApisBaseData } from "@onapi/domain/requests/types/base";

import { JSONSchemaObject } from "@onapi/domain/types/json-schema";

export interface ApiMetadata extends ApisBaseData {
  server_id?: string;
  // AI expect
  ai_expect?: AIExpect;
  // Whether AI expect is enabled
  ai_expect_enable: CustomNumberBooleanType;
  // Whether archived (1=yes, -1=no)
  is_exampled?: CustomNumberBooleanType;
  // Whether locked (1=yes, -1=no)
  is_locked: CustomNumberBooleanType;
  // Whether to enable response validation
  is_check_result: CustomNumberBooleanType;
  // Whether force save
  is_force: CustomNumberBooleanType;
  // Whether to push socket
  is_socket: CustomNumberBooleanType;
  // API test case group ID
  sample_group_id?: -1 | string;
  attribute_info: AnyObject;
  // Protocol
  protocol: string;
  // OpenAPI data
  open_api?: OpenApiData;
}

// HTTP, GraphQL and SSE share the native Postman request and event schema.
export type ApiDetailsData = ApiMetadata &
  Omit<
    import("@onapi/domain").HttpRequestItem,
    "kind" | "sort" | "project_id"
  > & {
    /** Non-HTTP collection entries retain their protocol-specific address metadata. */
    url?: string;
    method?: string;
  };

export type OpenApiData = {
  [url: string]: {
    [method: string]: OpenApiMainObj;
  };
};

export type OpenApiMainObj = {
  summary: string;
  description: string;
  tags: string[];
  parameters: ParametersItem[];
  requestBody: {
    content: {
      [content_type: string]: {
        schema?: JSONSchemaObject;
        example?: any;
      };
    };
  };
  responses: {
    [code: string]: {
      description: string;
      content: {
        [content_type: string]: {
          schema?: JSONSchemaObject;
          example?: any;
        };
      };
    };
  };
};

export type ParametersItem = {
  name: string;
  in: "header" | "query" | "cookie" | "path";
  description: string;
  required: boolean;
  example: string;
  schema: JSONSchemaObject;
};

// Tree directory item generated from base data
export type TreeDataItem = Pick<
  ApisBaseData,
  "id" | "kind" | "name" | "sort" | "mark_id" | "status" | "method" | "parentId"
> & {
  method: string;
  url: string;
  is_locked: -1 | 1;
  is_exampled: CustomNumberBooleanType;
  sample_group_id?: string;
  origin_parentId?: string;
  children?: Array<TreeDataItem>;
  [x: string]: any;
};

// api mark

// AI expect condition collection item
export interface ExpectConditionItem {
  conditionId?: string;
  location: "header" | "query" | "body" | "";
  // Parameter name
  name: string;
  // Comparison type
  compareType: CompareCalcSymbols;
  // Parameter value
  value: string;
}

// AI expect condition collection info
export interface ExpectItem {
  id: string;
  // Whether enabled
  enable: CustomNumberBooleanType;
  // Associated expect key
  expect_id: string;
  desc?: string;
  // Expect condition list
  conditions: Array<ExpectConditionItem>;
}

// AI expect info
export interface AIExpect {
  // Condition list
  list: Array<ExpectItem>;
  // Default expect when no match
  none_math_expect_id: string;
}

// Type used when apis content type cannot be determined
export type ApisData = ApisBaseData & AnyObject;

export type ApiComponentType = {
  apisData: ApiDetailsData;
  onApisDataChange: (data: ApisData) => void;
  type?: string;
};
