import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Flex } from "@/shared/ui/base";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import TreeCheckbox from "@/features/collections/components/TreeCheckbox/TreeCheckbox";
import { APIS_TARGET_TYPE_ENUM } from "@onapi/http-model/requests/constants/index";
import { PushEnvData } from "../type";
import { cloneDeep, isArray } from "lodash";
import { AppIcon } from "@/shared/ui";
import { openEnvPage } from "@/features/requests/events/env";
import VersionComparison from "@/features/sync/components/VersionComparison";

import { EnvListItem } from "@onapi/http-model/environment/types/index";

type PushLeftProps = {
  pushEnvData: Partial<PushEnvData>;
  updatePushEnvData: (key: string, val: any) => void;
  searchValue: string;
};

const envFieldNames = {
  title: "name",
  key: "env_id",
  parentKey: "parentId",
  children: "children",
  type: "kind",
  parentNodeType: APIS_TARGET_TYPE_ENUM.FOLDER,
};

const EnvCheckBox = (props: PushLeftProps) => {
  const { searchValue, pushEnvData, updatePushEnvData } = props;
  const { t } = useTranslation();

  const envList = useProjectConfig((store) => store?.envList) || [];

  const [comparisonModalObj, setComparisonModalObj] = useState({
    open: false,
    curItem: {},
  });
  const dataSource = useMemo(() => {
    if (isArray(pushEnvData?.conflictItems)) {
      let copyConflictItems = cloneDeep(pushEnvData?.conflictItems);
      return copyConflictItems.reduce((pre: any, cur: any) => {
        cur.localEnv.parentId = "0";
        cur.localEnv.kind = "env";
        if (cur?.localEnv?.env_id) {
          pre[cur.localEnv.env_id] = cur.localEnv;
        }
        return pre;
      }, {});
    }
    return {};
  }, [pushEnvData?.conflictItems]);

  const titleRender = (nodeData: any) => {
    return (
      <Flex align="center" justify="space-between">
        {/* Node title */}
        <div
          data-part="title"
          style={{
            flex: 1,
            width: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {nodeData?.title}
        </div>

        {/* Custom button */}
        <AppIcon
          onClick={(e) => {
            e.stopPropagation();
            // Open environment page
            openEnvPage({
              env_id: nodeData?.key,
            });
          }}
          icon="eye"
        ></AppIcon>
      </Flex>
    );
  };

  const conflictTitleRender = (nodeData: any) => {
    return (
      <Flex align="center" justify="space-between">
        {/* Node title */}
        <div
          data-part="title"
          style={{
            flex: 1,
            width: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {nodeData?.title}
        </div>

        {/* Custom button */}
        <AppIcon
          onClick={(e) => {
            e.stopPropagation();
            // Find local and cloud data
            const curItem = pushEnvData?.conflictItems?.find(
              (i) => i?.localEnv?.env_id === nodeData?.key,
            );

            // Open comparison modal
            if (curItem !== undefined) {
              setComparisonModalObj({
                open: true,
                curItem: curItem,
              });
            }
          }}
          icon="git-compare-arrows"
        ></AppIcon>
      </Flex>
    );
  };

  return (
    <>
      {!isArray(pushEnvData?.conflictItems) ||
      pushEnvData.conflictItems.length <= 0 ? (
        <>
          <Flex style={{ flex: 1 }}>
            <TreeCheckbox
              hasMarkFilter={false}
              hideSearchInput={true}
              searchValue={searchValue}
              originTreeProps={{
                fieldNames: envFieldNames,
                titleRender,
              }}
              typeIncludes={["env"]}
              dataSource={cloneDeep(envList).reduce((pre: any, cur: any) => {
                cur.parentId = "0";
                cur.kind = "env";
                if (cur?.env_id) {
                  pre[cur.env_id] = cur;
                }
                return pre;
              }, {})}
              checkedKeys={pushEnvData?.checkedKeys || []}
              setCheckedKeys={(keys) => updatePushEnvData("checkedKeys", keys)}
            />
          </Flex>
        </>
      ) : (
        <Flex style={{ flex: 1 }}>
          <TreeCheckbox
            hasMarkFilter={false}
            hideSearchInput={true}
            searchValue={searchValue}
            originTreeProps={{
              fieldNames: envFieldNames,
              titleRender: conflictTitleRender,
            }}
            typeIncludes={["env"]}
            dataSource={dataSource}
            checkedKeys={pushEnvData?.conflictCheckedKeys || []}
            setCheckedKeys={(keys) =>
              updatePushEnvData("conflictCheckedKeys", keys)
            }
          />
        </Flex>
      )}
      <VersionComparison
        open={comparisonModalObj.open}
        onCancel={() =>
          setComparisonModalObj({
            open: false,
            curItem: {},
          })
        }
        curItem={
          comparisonModalObj.curItem as {
            localEnv: EnvListItem;
            cloudEnv: EnvListItem;
          }
        }
      />
    </>
  );
};
export default EnvCheckBox;
