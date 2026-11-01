import { useMemo } from "react";

import { cloneDeep, forEach, includes, some } from "lodash-es";

import type { EditorRecord } from "@onapi/domain/requests/record";
import { TreeDataFilterParams } from "@/features/collections/types/tree";
import { ShareInfoData } from "@onapi/domain/sharing/types/share";

interface Props {
  dataSource: EditorRecord[];
  treeDataFilterParams: TreeDataFilterParams;
  searchIncludesField?: (keyof EditorRecord)[];
  shareData: { [key: string]: ShareInfoData };
}

const useDocsData = (props: Props) => {
  const { treeDataFilterParams, dataSource, shareData, searchIncludesField } =
    props;

  // Filtered flat array
  const filteredShareList: Array<
    EditorRecord & {
      share_time: number;
    }
  > = useMemo(() => {
    if (dataSource === undefined) {
      return [];
    }

    const { value } = treeDataFilterParams;
    const sourceData = cloneDeep(dataSource);
    const newList: (EditorRecord & {
      share_time: number;
    })[] = [];

    const sourceDataObj = sourceData.reduce(
      (pre: { [key: string]: EditorRecord }, cur: EditorRecord) => {
        pre[cur.id] = cur;
        return pre;
      },
      {},
    );
    forEach(shareData, (data, id) => {
      const localSourceData: EditorRecord = sourceDataObj?.[id];
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
