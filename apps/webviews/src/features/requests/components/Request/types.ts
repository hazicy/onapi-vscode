import { TabsProps } from "@/shared/ui/base";

import { ApisBaseDataItem } from "@onapi/http-model/requests/types/base";
import { ApiDetailsData } from "@onapi/http-model/requests/types/api";
import { GlobalParamsHeaderItem } from "@onapi/http-model/project/types/index";

export type RequestTabsItemProps = {
  paramsType?: "global" | "folder" | "request" | "";
  tabType?: "header" | "query" | "restful" | "body" | "cookie" | "event";
  folderParams?: ApisBaseDataItem[];
  globalParams?: GlobalParamsHeaderItem[];
};

export interface RequestProps {
  apiData: import("@onapi/http-model/requests/types/api").ApiDetailsData;
  requestData: import("@onapi/http-model").HttpRequest;
  onItemChange: (
    item: import("@onapi/http-model/requests/types/api").ApiDetailsData,
  ) => void;
  onRequestDataChange: (
    request: import("@onapi/http-model").HttpRequest,
  ) => void;
  includesTabs?: string[];
  extra?: TabsProps["items"];
  tabOptions?: TabsProps;
  tabBarExtraContent?: import("react").ReactNode;
  direction?: import("@onapi/http-model/types/common").DirectionType;
  id?: string;
}
