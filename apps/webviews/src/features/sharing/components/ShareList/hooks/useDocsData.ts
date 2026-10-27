import { useMemo } from "react";

import { cloneDeep, forEach, includes, some } from "lodash-es";

import { ApiDetailsData } from "@onapi/domain/requests/types/api";
import { TreeDataFilterParams } from "@/features/collections/types/tree";
import { ShareInfoData } from "@onapi/domain/sharing/types/share";

interface Props {
  dataSource: ApiDetailsData[];
  treeDataFilterParams: TreeDataFilterParams;
  searchIncludesField?: (keyof ApiDetailsData)[];
  shareData: { [key: string]: ShareInfoData };
}

const useDocsData = (props: Props) => {
  const { treeDataFilterParams, dataSource, shareData, searchIncludesField } =
    props;

  // Filtered flat array
  const filteredShareList: Array<
    ApiDetailsData & {
      share_time: number;
    }
  > = useMemo(() => {
    if (dataSource === undefined) {
      return [];
    }

    const { value } = treeDataFilterParams;
    const sourceData = cloneDeep(dataSource);
    const newList: (ApiDetailsData & {
      share_time: number;
    })[] = [];

    const sourceDataObj = sourceData.reduce(
      (pre: { [key: string]: ApiDetailsData }, cur: ApiDetailsData) => {
        pre[cur.id] = cur;
        return pre;
      },
      {},
    );
    forEach(shareData, (data, id) => {
      const localSourceData: ApiDetailsData = sourceDataObj?.[id];
      if (localSourceData) {
        const searchIncludes = some(searchIncludesField, (field) =>
          includes(
            `${localSourceData?.[field]}`.toLowerCase(),
            value.toLowerCase(),
          ),
        );
        if (searchIncludes) {
          newList.push({
            ...localSourceData,
            share_time: data.share_time,
          });
        }
      }
    });

    return newList?.sort((a, b) => b?.share_time - a?.share_time);
  }, [dataSource, treeDataFilterParams, shareData]);

  return { filteredShareList };
};

export default useDocsData;
