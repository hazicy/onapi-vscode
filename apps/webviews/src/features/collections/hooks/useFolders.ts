import { useEffect, useState } from "react";

import i18next from "i18next";
import {
  cloneDeep,
  concat,
  includes,
  isArray,
  isEqual,
  isString,
} from "lodash";

import { APIS_TARGET_TYPE_ENUM } from "@onapi/http-model/requests/constants/index";
import useApis from "@/features/requests/store/useApis";
import { arrayToTreeObject, flatTreeItems } from "@/shared/utils/common";
import { ApiDetailsData } from "@onapi/http-model/requests/types/api";

interface Props {
  currentTargetId?: string;
  addRootFolder?: boolean;
}

export const useFolders = (props?: Props) => {
  const { currentTargetId = "", addRootFolder = true } = props || {};

  const [apisFolders, setApisFolders] = useState<ApiDetailsData[]>([]);
  const [flatApisFolders, setFlatApisFolders] = useState<any[]>([]);
  const apiOriginDetailsList = useApis((state) => state.apiOriginDetailsList);

  const nodeSort = (pre: any, after: any) => {
    if (pre.sort !== after.sort) {
      return pre.sort - after.sort;
    }
    if (isString(pre?.name) && isString(after?.name)) {
      return `${pre.name}`.localeCompare(`${after.name}`);
    }
    return 0;
  };

  useEffect(() => {
    if (isArray(apiOriginDetailsList)) {
      const apiArr = cloneDeep(
        addRootFolder
          ? concat(
              [
                {
                  id: "0",
                  parentId: "0",
                  name: i18next.t("root"),
                  sort: 0,
                  kind: APIS_TARGET_TYPE_ENUM.FOLDER,
                  status: 0,
                } as any,
              ],
              apiOriginDetailsList,
            )
          : apiOriginDetailsList,
      )
        .filter(
          (item) =>
            isEqual(item.kind, APIS_TARGET_TYPE_ENUM.FOLDER) &&
            !includes([-1, -2, -99], item.status) &&
            !isEqual(item.id, currentTargetId),
        )
        .sort(nodeSort);

      const newApiArr = arrayToTreeObject(apiArr);
      const selectOptions = flatTreeItems(
        newApiArr,
        (a: any, b: any) => a.sort - b.sort,
      );
      setFlatApisFolders(selectOptions);
      setApisFolders(newApiArr);
    }
  }, [apiOriginDetailsList]);

  return {
    apisFolders,
    flatApisFolders,
  };
};

export default useFolders;
