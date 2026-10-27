import { TabsProps } from "@/shared/ui/base";

import { ApisBaseDataItem } from "@onapi/domain/requests/types/base";
import { ApiDetailsData } from "@onapi/domain/requests/types/api";
import { GlobalParamsHeaderItem } from "@onapi/domain/project/types/index";

export type RequestTabsItemProps = {
  paramsType?: "global" | "folder" | "request" | "";
  tabType?: "header" | "query" | "restful" | "body" | "cookie" | "event";
  folderParams?: ApisBaseDataItem[];
  globalParams?: GlobalParamsHeaderItem[];
};

export interface RequestProps {
  apiData: import("@onapi/domain/requests/types/api").ApiDetailsData;
  requestData: import("@onapi/domain").HttpRequest;
  onItemChange: (
    item: import("@onapi/domain/requests/types/api").ApiDetailsData,
  ) => void;
  onRequestDataChange: (request: import("@onapi/domain").HttpRequest) => void;
  includesTabs?: string[];
  extra?: TabsProps["items"];
  tabOptions?: TabsProps;
  tabBarExtraContent?: import("react").ReactNode;
  direction?: import("@onapi/domain/types/common").DirectionType;
  id?: string;
}
