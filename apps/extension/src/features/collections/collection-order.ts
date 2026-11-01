import type { EditorRecord } from "@onapi/domain/requests/record";
import { getCollectionChildIds } from "./collection-tree";

export const getAllChildIds = (
  apiList: EditorRecord[],
  apisData: EditorRecord,
) => getCollectionChildIds(apiList, apisData);

export const getMaxSort = (apiList: EditorRecord[], parentId: string = "0") => {
  const childList = apiList.filter(
    (i: EditorRecord) => i?.parentId === parentId,
  );
  const maxSort = childList.reduce(
    (max, obj) => Math.max(max, obj.sort ?? 0),
    0,
  );
  return maxSort + 1;
};
