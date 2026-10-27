import React from "react";

import { cloneDeep, isArray } from "lodash";

const useListData: (props: any) => any = (props) => {
  const { menuList, filterName } = props;

  const filteredTreeList: Array<any> = React.useMemo(() => {
    if (!isArray(menuList)) {
      return [];
    }

    const sourceList = cloneDeep(menuList);

    const sourceData: { [key: string]: any } = {};
    for (const item of sourceList) {
      sourceData[item.model_id] = item;
    }

    const newList: { [key: string]: any } = {};
    for (const data of sourceList) {
      const includeName =
        filterName === "" ||
        `${data?.name}`.toLowerCase().indexOf(filterName.toLowerCase()) !==
          -1 ||
        `${data?.display_name}`
          .toLowerCase()
          .indexOf(filterName.toLowerCase()) !== -1;

      if (includeName === true) {
        newList[data.model_id] = data;
        let parent = sourceData[data.parentId];
        while (parent !== undefined && newList[parent.model_id] !== parent) {
          newList[parent.model_id] = parent;
          parent = sourceData[parent.parentId];
        }
      }
    }
    const dataList: Array<any> = [];
    Object.entries(newList).forEach(([model_id, data]: [string, any]) => {
      dataList.push({
        ...data,
        model_id,
      });
    });
    return dataList?.sort((a, b) => a?.sort - b?.sort);
  }, [menuList, filterName]);

  return {
    filteredTreeList,
  };
};
export default useListData;
