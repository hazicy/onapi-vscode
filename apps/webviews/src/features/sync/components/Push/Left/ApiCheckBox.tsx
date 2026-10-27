import React from "react";
import { Flex } from "@/shared/ui/base";
import useApis from "@/features/requests/store/useApis";
import TreeCheckbox from "@/features/collections/components/TreeCheckbox";
import { APIS_TARGET_TYPE_ENUM } from "@onapi/http-model/requests/constants/index";
import Conflict from "../Conflict";
import { PushApiData } from "../type";
import { isArray } from "lodash";

type ApiCheckBoxProps = {
  halfCheckedKeys: Array<React.Key>;
  setHalfCheckedKeys: any;
  pushApiData: Partial<PushApiData>;
  updatePushApiData: (key: string, val: any) => void;
  searchValue: string;
};

const customFieldNames = {
  title: "name",
  key: "id",
  parentKey: "parentId",
  children: "children",
  type: "kind",
  parentNodeType: APIS_TARGET_TYPE_ENUM.FOLDER,
};

const ApiCheckBox = (props: ApiCheckBoxProps) => {
  const {
    searchValue,
    halfCheckedKeys,
    setHalfCheckedKeys,
    pushApiData,
    updatePushApiData,
  } = props;
  const apiOriginDetailsList = useApis((store) => store.apiOriginDetailsList);

  return (
    <>
      {!isArray(pushApiData?.conflictItems) ||
      pushApiData.conflictItems.length <= 0 ? (
        <Flex vertical gap={8} flex={1}>
          <Flex style={{ flex: 1 }}>
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
              dataSource={apiOriginDetailsList.reduce((pre: any, cur) => {
                if (cur?.id) {
                  pre[cur.id] = cur;
                }
                return pre;
              }, {})}
              checkedKeys={pushApiData?.checkedKeys || []}
              setCheckedKeys={(keys) => updatePushApiData("checkedKeys", keys)}
              halfCheckedKeys={halfCheckedKeys}
              setHalfCheckedKeys={setHalfCheckedKeys}
            />
          </Flex>
        </Flex>
      ) : (
        <Conflict
          setConflictCheckedKeys={(val: any) =>
            updatePushApiData("conflictCheckedKeys", val)
          }
          conflictCheckedKeys={pushApiData?.conflictCheckedKeys || []}
          searchValue={searchValue}
          conflictItems={pushApiData?.conflictItems || []}
        />
      )}
    </>
  );
};
export default ApiCheckBox;
