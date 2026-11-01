import type {
  GlobalParamsHeaderItem,
  GlobalParamsTypeItem,
  GlobalParamsCookieItem,
} from "@onapi/domain/project/types/index";
import { APIS_TASK_TYPES_ENUM } from "@onapi/domain/requests/constants/index";
// Onapi file-format definitions. Conversion happens at import/export boundaries.

import type { CustomNumberBooleanType } from "@onapi/domain/types/common";
import type { Auth } from "@onapi/domain/requests/types/auth";

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
