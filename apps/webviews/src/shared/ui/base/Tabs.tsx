import tabsStyles from "./Tabs.module.css";
import React, { useState } from "react";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import clsx from "clsx";
import type { TabsProps } from "./types";
import { Dropdown } from "./Dropdown";
import { useOverflowTabs } from "./useOverflowTabs";

export function Tabs({
  tabButtonClassName,
  navClassName,
  navWrapClassName,
  tabListClassName,
  tabClassName,
  activeTabClassName,
  contentClassName,
  panelsClassName,
  panelClassName,

  overflow = false,
  overflowLabel = "More tabs",
  items = [],
  activeKey,
  defaultActiveKey,
  onChange,
  onEdit,
  tabBarExtraContent,
  type,
  destroyInactiveTabPane,
  tabPosition,
  size,
  animated,
  className,
  rootClassName,
  ...props
}: TabsProps) {
  const [selected, setSelected] = useState(defaultActiveKey ?? items[0]?.key);
  const current = activeKey ?? selected;
  const { wrapRef, listRef, moreRef, visibleKeys } = useOverflowTabs(
    items.map((item) => item.key),
    current,
    overflow,
  );
  const hiddenItems = items.filter(
    (item) => visibleKeys !== null && !visibleKeys.includes(item.key),
  );
  const selectTab = (key: string) => {
    setSelected(key);
    onChange?.(key);
  };
  const extra =
    tabBarExtraContent &&
    !React.isValidElement(tabBarExtraContent) &&
    typeof tabBarExtraContent === "object" &&
    ("left" in tabBarExtraContent || "right" in tabBarExtraContent)
      ? tabBarExtraContent
      : { right: tabBarExtraContent as React.ReactNode };
  return (
    <BaseTabs.Root
      {...props}
      value={current}
      onValueChange={(key) => {
        selectTab(String(key));
      }}
      className={clsx(
        tabsStyles.tabs,
        (tabPosition === undefined || tabPosition === "top") && undefined,
        className,
        rootClassName,
      )}
    >
      <div className={clsx(tabsStyles.nav, navClassName)}>
        {extra.left}
        <div
          ref={wrapRef}
          className={clsx(
            tabsStyles.navWrap,
            overflow && tabsStyles.overflowNavWrap,
            navWrapClassName,
          )}
        >
          <BaseTabs.List
            ref={listRef}
            className={clsx(
              tabsStyles.tabList,
              overflow && tabsStyles.overflowList,
              tabListClassName,
            )}
          >
            {items.map((item) => (
              <span
                key={item.key}
                aria-hidden={hiddenItems.includes(item) || undefined}
                inert={hiddenItems.includes(item) || undefined}
                className={clsx(
                  tabsStyles.tabItem,
                  hiddenItems.includes(item) && tabsStyles.overflowHidden,
                  item.tabExtra && tabsStyles.tabWithExtra,
                  current === item.key && tabsStyles.tabItemActive,
                  tabClassName,
                  current === item.key && activeTabClassName,
                )}
              >
                <BaseTabs.Tab
                  value={item.key}
                  disabled={item.disabled || hiddenItems.includes(item)}
                  className={clsx(tabsStyles.tab, tabButtonClassName)}
                >
                  {item.label}
                </BaseTabs.Tab>
                {item.tabExtra}
                {type === "editable-card" && item.closable !== false && (
                  <button
                    type="button"
                    aria-label="Close tab"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(item.key, "remove");
                    }}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </BaseTabs.List>
          {overflow && (
            <div
              className={clsx(
                tabsStyles.overflowMenu,
                !hiddenItems.length && tabsStyles.overflowMenuHidden,
              )}
              inert={!hiddenItems.length || undefined}
              aria-hidden={!hiddenItems.length || undefined}
            >
              <Dropdown
                trigger={["click"]}
                menu={{
                  items: hiddenItems.map((item) => ({
                    key: item.key,
                    label: item.label,
                    disabled: item.disabled,
                  })),
                  onClick: ({ key }) => selectTab(key),
                }}
              >
                <button
                  ref={moreRef}
                  type="button"
                  className={tabsStyles.moreTabs}
                  aria-label={overflowLabel}
                  title={overflowLabel}
                >
                  »
                </button>
              </Dropdown>
            </div>
          )}
        </div>
        {extra.right}
      </div>
      <div className={clsx(tabsStyles.contentHolder, contentClassName)}>
        <div className={clsx(tabsStyles.content, panelsClassName)}>
          {items.map((item) => (
            <BaseTabs.Panel
              key={item.key}
              value={item.key}
              keepMounted={!destroyInactiveTabPane && !item.destroyOnHidden}
              className={clsx(tabsStyles.tabPanel, panelClassName)}
            >
              {item.children}
            </BaseTabs.Panel>
          ))}
        </div>
      </div>
    </BaseTabs.Root>
  );
}
