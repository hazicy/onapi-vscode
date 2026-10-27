import { getCollectionChildIds } from "./collection-tree";
import { ApiDetailsData } from "@onapi/http-model/requests/types/api";
import { reduce } from "lodash";

export const getAllChildIds = (
  apiList: ApiDetailsData[],
  apisData: ApiDetailsData,
) => getCollectionChildIds(apiList, apisData);

export const getMaxSort = (
  apiList: ApiDetailsData[],
  parentId: string = "0",
) => {
  const childList = apiList.filter(
    (i: ApiDetailsData) => i?.parentId === parentId,
  );
  const maxSort = childList.reduce(
    (max, obj) => (obj?.sort > max ? obj?.sort : max),
    0,
  );
  return maxSort + 1;
};
