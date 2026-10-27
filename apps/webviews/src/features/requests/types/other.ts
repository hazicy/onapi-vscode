import { Hoonapi } from "@/shared/ui/base";

import { APIS_TARGET_TYPE_ENUM } from "@onapi/domain/requests/constants/index";

import { ApiDetailsData } from "@onapi/domain/requests/types/api";

export type ApisItemActionType = {
  apisData: ApiDetailsData;
  projectId: string;
  childTargetType?: APIS_TARGET_TYPE_ENUM;
  modal?: Hoonapi;
  tabsValue?: string;
};

/** A cURL conversion produces an SDK request definition, not legacy parameter tables. */
export type CurlDataType = {
  request: import("postman-collection").RequestDefinition;
};
