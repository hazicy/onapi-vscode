import styles from "./FolderEditor.module.css";
import { FC, FunctionComponent, memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { SegmentedProps } from "@/shared/ui/base";

import { useMemoizedFn, useSafeState } from "ahooks";
import { find, head, includes, isArray, last, map } from "lodash-es";

import { SegmentedTabs } from "@/shared/components";

import { APIS_TARGET_TYPE_ENUM } from "@onapi/http-model/requests/constants/index";
import useSystemConfig from "@/features/settings/store/useSystemConfig";

import ContentItemWrap from "./ContentItemWrap";
import { APIS_CONTENT_MAP } from "./constants";

import { ApiComponentType } from "@onapi/http-model/requests/types/api";
import ToolBar from "./ToolBar";

const FolderEditor: FC<ApiComponentType> = ({ apisData }) => {
  const { t } = useTranslation();
  const targetType = apisData?.kind;

  const [tabsValue, setTabsValue] = useSafeState<string | number>();

  const updateTabsValue = async (
    targetTabs: {
      value: string;
      label: string;
      children: FunctionComponent<{ apisData: any; onApisDataChange: any }>;
    }[],
    newTabsValue: string,
  ) => {
    let value = newTabsValue;
    setTabsValue(value);
  };

  const result = useMemo(() => {
    const targetTabs = APIS_CONTENT_MAP[`${targetType}`];

    if (isArray(targetTabs)) {
      const { systemConfig } = useSystemConfig.getState();
      const { open_new_tab } = systemConfig;

      let newTabsValue = head(targetTabs)?.value || "";

      if (
        includes(
          [APIS_TARGET_TYPE_ENUM.API, APIS_TARGET_TYPE_ENUM.SOCKET_METHOD],
          targetType,
        )
      ) {
        // HTTP, TCP follow config
        if (find(targetTabs, (findItem) => findItem.value === open_new_tab)) {
          newTabsValue = open_new_tab;
        } else {
          newTabsValue = head(targetTabs)?.value || "";
        }
      } else if (
        !includes(
          [APIS_TARGET_TYPE_ENUM.DOC, APIS_TARGET_TYPE_ENUM.FOLDER],
          targetType,
        )
      ) {
        // Other types check if config exists in tabs, otherwise use the last one
        if (find(targetTabs, (findItem) => findItem.value === open_new_tab)) {
          newTabsValue = open_new_tab;
        } else {
          newTabsValue = last(targetTabs)?.value || "";
        }
      }
      updateTabsValue(targetTabs, newTabsValue);
    }

    return targetTabs;
  }, [targetType]);

  const segmentedOptions = useMemo(
    () =>
      (isArray(result) &&
        map(result, (item) => ({
          ...item,
          children: (
            <ContentItemWrap
              key={apisData.id}
              apisData={apisData}
              contentType={item.value}
              activeContentType={tabsValue}
              element={item.children}
            />
          ),
        }))) ||
      [],
    [result, tabsValue, apisData],
  );

  const handleOptionsChange: SegmentedProps["onChange"] = useMemoizedFn(
    async (value) => {
      setTabsValue(value);
    },
  );

  if (!result) {
    return null;
  }

  return (
    <>
      {isArray(result) ? (
        <div className={styles.container}>
          <SegmentedTabs
            options={segmentedOptions}
            wrapClassName={styles.customSegmentedTabsWrap}
            value={tabsValue}
            onChange={handleOptionsChange}
            tabBarExtraContent={<ToolBar />}
            headerClassName={styles.segmentedTabsHeader}
          />
        </div>
      ) : (
        <div className={styles.container}>
          <ContentItemWrap
            key={apisData.id}
            apisData={apisData}
            element={result}
          />
        </div>
      )}
    </>
  );
};

const MemoizedFolderEditor = memo(FolderEditor);

export default MemoizedFolderEditor;
