import tabsStyles from "./Tabs.module.css";
import React, { useState } from "react";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import clsx from "clsx";
import type { TabsProps } from "./types";

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
        setSelected(String(key));
        onChange?.(String(key));
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
        <div className={clsx(tabsStyles.navWrap, navWrapClassName)}>
          <BaseTabs.List className={clsx(tabsStyles.tabList, tabListClassName)}>
            {items.map((item) => (
              <span
                key={item.key}
                className={clsx(
                  tabsStyles.tabItem,
                  item.tabExtra && tabsStyles.tabWithExtra,
                  current === item.key && tabsStyles.tabItemActive,
                  tabClassName,
                  current === item.key && activeTabClassName,
                )}
              >
                <BaseTabs.Tab
                  value={item.key}
                  disabled={item.disabled}
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
