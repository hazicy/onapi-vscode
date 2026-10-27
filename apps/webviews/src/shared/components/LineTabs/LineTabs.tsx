import classNames from "classnames";
import styles from "./LineTabs.module.css";
import { FC, ReactNode, useMemo } from "react";

import { TabPaneProps, Tabs, TabsProps } from "@/shared/ui/base";

import { map } from "lodash-es";

import HeaderCount from "./HeaderCount";

type LineTabsItems = Omit<TabPaneProps, "tab"> & {
  key: string;
  label: ReactNode;
  countParams?: {
    dataSource?: any;
    showDot?: boolean;
    customCalcFun?: (dataSource: any) => number;
  };
};

type Props = TabsProps & {
  items?: LineTabsItems[];
  wrapStyle?: any;
};

const LineTabs: FC<Props> = ({ items, wrapStyle, ...resetProps }) => {
  const finalItems = useMemo(() => {
    return map(items, (item) => {
      return {
        ...item,
        label: item?.countParams ? (
          <>
            <HeaderCount label={item.label} {...item.countParams} />
          </>
        ) : (
          item.label
        ),
      };
    });
  }, [items]);

  return (
    <div style={{ ...wrapStyle }} className={styles.container}>
      <Tabs
        items={finalItems}
        {...resetProps}
        animated={false}
        panelClassName={classNames(
          styles.tabsTabpane,
          resetProps.panelClassName,
        )}
        panelsClassName={classNames(
          styles.tabsContent,
          resetProps.panelsClassName,
        )}
        contentClassName={classNames(
          styles.tabsContentHolder,
          resetProps.contentClassName,
        )}
        className={classNames(styles.tabs, resetProps.className)}
        tabClassName={classNames(styles.tabsTab, resetProps.tabClassName)}
        navWrapClassName={classNames(
          styles.tabsNavWrap,
          resetProps.navWrapClassName,
        )}
      />
    </div>
  );
};

export default LineTabs;
