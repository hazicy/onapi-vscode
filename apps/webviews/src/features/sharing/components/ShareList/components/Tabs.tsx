import styles from "../ShareList.module.css";
import { Checkbox, Flex, Tabs, Tooltip, Typography } from "@/shared/ui/base";

import { SHARE_TAB_LIST } from "../constants";
import { TabsProps } from "../types";

import cn from "classnames";

import { isArray } from "lodash-es";
import { Empty } from "@/shared/ui";
import { ApiDetailsData } from "@onapi/http-model/requests/types/api";
import ApisColorPrefixIcon from "@/shared/ui/ApisColorPrefixIcon";
import { getBaseIconOfTargetType } from "@/shared/utils/common";
import { formatTimeToDateTimeLong } from "@onapi/http-model/utils/time";
import { useMemo } from "react";

const TabsPanel = (props: TabsProps) => {
  const {
    tabExtraContent,
    checkedList,
    lists,
    listExtraContent,
    setCheckedList,
  } = props || {};

  const renderContent = (item: ApiDetailsData & { share_time: number }) => {
    return (
      <div
        key={item.id}
        onClick={() => {}}
        className={cn(styles.itemTitle, {
          [styles.selectItem]: false,
        })}
      >
        <div className={styles.name}>
          <Checkbox
            onClick={(e) => e?.stopPropagation()}
            value={item.id}
          ></Checkbox>
          <ApisColorPrefixIcon
            className={styles.panelIcon}
            icon={getBaseIconOfTargetType(item.kind).icon}
            gradientColor={getBaseIconOfTargetType(item.kind).gradientColor}
          />
          <Tooltip
            title={
              <Flex gap={4} vertical className={styles.flex}>
                <Typography.Text>{item?.name}</Typography.Text>
                <Typography.Text>{item?.url}</Typography.Text>
              </Flex>
            }
          >
            <Typography.Text ellipsis style={{ flex: 1 }}>
              {item.name}
            </Typography.Text>
          </Tooltip>
        </div>
        <div className={styles.time}>
          {formatTimeToDateTimeLong(item.share_time)}
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
          className={styles.moreOperateWrap}
        >
          {listExtraContent(item.id, item)}
        </div>
      </div>
    );
  };
  const tabsItems = useMemo(() => {
    return SHARE_TAB_LIST.map((item) => ({
      label: item.label,
      key: item.key,
      children: (
        <Checkbox.Group
          className={styles.checkboxGroup}
          value={checkedList}
          onChange={(list) => {
            setCheckedList(list);
          }}
        >
          {isArray(lists) && lists.length > 0 ? (
            <div className={styles.shareList}>
              {lists.map((item) => renderContent(item))}
            </div>
          ) : (
            <Empty imageClassName={styles.emptyImage} />
          )}
        </Checkbox.Group>
      ),
    })) as any;
  }, [checkedList, lists]);
  return (
    <div className={styles.tabs}>
      <Tabs
        tabBarGutter={6}
        destroyInactiveTabPane
        tabBarExtraContent={tabExtraContent}
        items={tabsItems}
        tabClassName={styles.tabsTab}
        panelClassName={styles.tabsTabpane}
        panelsClassName={styles.tabsContent}
        className={styles.tabs}
        tabButtonClassName={styles.tabsTabBtn}
      />
    </div>
  );
};

export default TabsPanel;
