import styles from "./index.module.css";
import React from "react";

import { List } from "@/shared/ui/base";

import { useMount, useSafeState } from "ahooks";
import classnames from "classnames";

import RowItem from "./RowItem";
import { RowItemTipsConfig } from "./types";

interface Props {
  data: any;
  onItemClick?: (item: any) => void;
  renderTitle?: (data: any) => React.ReactNode;
  customTipsContent?: (data: any) => RowItemTipsConfig;
}
const FlowResponse = (props: Props) => {
  const { data, renderTitle, onItemClick, customTipsContent } = props || {};
  const [active, setActive] = useSafeState<string>();
  useMount(() => {
    onItemClick?.(data?.[0]);
  });
  return (
    <div className={styles.container}>
      <List
        size="small"
        dataSource={data}
        renderItem={(item: any) => (
          <List.Item
            key={item.id}
            className={classnames({
              [styles.active]: active === item.id,
            })}
            onClick={() => {
              setActive(item.id);
              onItemClick?.(item);
            }}
          >
            <RowItem
              data={item}
              renderTitle={renderTitle}
              customTipsContent={customTipsContent}
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default FlowResponse;
