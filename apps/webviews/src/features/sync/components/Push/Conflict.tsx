import { Flex } from "@/shared/ui/base";
import TreeCheckbox from "@/features/collections/components/TreeCheckbox/TreeCheckbox";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { APIS_TARGET_TYPE_ENUM } from "@onapi/domain/requests/constants/index";
import { cloneDeep, reduce } from "lodash-es";

const customFieldNames = {
  title: "name",
  key: "id",
  parentKey: "parentId",
  children: "children",
  type: "kind",
  parentNodeType: APIS_TARGET_TYPE_ENUM.FOLDER,
};

const Conflict = (props: {
  searchValue: string;
  conflictItems: any;
  conflictCheckedKeys: Array<React.Key>;
  setConflictCheckedKeys: any;
}) => {
  const {
    conflictItems,
    searchValue,
    conflictCheckedKeys,
    setConflictCheckedKeys,
  } = props;
  const { t } = useTranslation();

  const dataSource = useMemo(() => {
    const cloneConflictItems = cloneDeep(conflictItems);

    return reduce(
      cloneConflictItems,
      (pre: any, cur: any, index: number) => {
        if (cur?.id) {
          cur.sort = index;
          pre[cur.id] = cur;
        }
        return pre;
      },
      {},
    );
  }, [conflictItems]);

  return (
    <>
      <Flex flex={1} vertical gap={8}>
        <Flex flex={1}>
          <TreeCheckbox
            hasMarkFilter={false}
            hideSearchInput={true}
            searchValue={searchValue}
            originTreeProps={{
              fieldNames: customFieldNames,
            }}
            typeIncludes={[
              "api",
              "sse",
              "folder",
              "websocket",
              "socketio",
              "graphql",
            ]}
            folderIncludes={["folder"]}
            notCalcCheckedTypes={["folder"]}
            notCalcChildrenCountTypes={["folder"]}
            dataSource={dataSource}
            checkedKeys={conflictCheckedKeys}
            setCheckedKeys={setConflictCheckedKeys}
          />
        </Flex>
      </Flex>
    </>
  );
};

export default Conflict;
