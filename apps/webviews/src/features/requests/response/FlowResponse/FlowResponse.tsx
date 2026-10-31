import styles from "./FlowResponse.module.css";
import React from "react";

import { List } from "@/shared/ui/base";

import { useMount, useSafeState } from "ahooks";
import clsx from "clsx";

import RowItem from "./RowItem";
import { RowItemTipsConfig } from "./types";

interface Props {
  data: any;
  autoSelectFirst?: boolean;
  compact?: boolean;
  onItemClick?: (item: any) => void;
  renderTitle?: (data: any) => React.ReactNode;
  customTipsContent?: (data: any) => RowItemTipsConfig;
}
const FlowResponse = (props: Props) => {
  const {
    data,
    renderTitle,
    onItemClick,
    customTipsContent,
    autoSelectFirst = true,
    compact = false,
  } = props || {};
  const [active, setActive] = useSafeState<string>();
  useMount(() => {
    if (autoSelectFirst) {
      onItemClick?.(data?.[0]);
    }
  });
  return (
    <div className={clsx(styles.container, compact && styles.compact)}>
      <List
        dataSource={data}
        renderItem={(item: any) => (
          <List.Item
            key={item.id}
            className={clsx({
              [styles.active]: active === item.id,
            })}
            role={onItemClick ? "button" : undefined}
            tabIndex={onItemClick ? 0 : undefined}
            aria-pressed={onItemClick ? active === item.id : undefined}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setActive(item.id);
                onItemClick?.(item);
              }
            }}
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
