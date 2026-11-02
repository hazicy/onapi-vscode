import collapseStyles from "./Collapse.module.css";
import AppIcon from "../AppIcon";
import { Accordion } from "@base-ui/react/accordion";
import clsx from "clsx";
import { useState } from "react";
import type { CollapseProps } from "./types";

const array = (v: any) =>
  v === undefined ? undefined : Array.isArray(v) ? v : [v];

export function Collapse({
  itemClassName,
  headerClassName,
  triggerClassName,
  panelClassName,
  contentClassName,

  items = [],
  activeKey,
  defaultActiveKey,
  accordion,
  onChange,
  expandIcon,
  expandIconPosition = "start",
  ghost,
  bordered = true,
  destroyInactivePanel,
  className,
  rootClassName,
  ...props
}: CollapseProps) {
  const [expanded, setExpanded] = useState(() => array(defaultActiveKey) ?? []);
  const current = array(activeKey) ?? expanded;
  return (
    <Accordion.Root
      {...props}
      className={clsx(collapseStyles.collapse, className, rootClassName)}
      value={current}
      multiple={!accordion}
      onValueChange={(v) => {
        if (activeKey === undefined) {
          setExpanded(v);
        }
        onChange?.(accordion ? v[0] : v);
      }}
    >
      {items.map((item) => (
        <Accordion.Item
          key={String(item.key)}
          value={item.key}
          disabled={item.collapsible === "disabled"}
          className={clsx(collapseStyles.item, itemClassName, item.className)}
          style={item.style}
        >
          <Accordion.Header className={headerClassName}>
            <Accordion.Trigger
              className={clsx(
                collapseStyles.trigger,
                expandIconPosition === "end" && collapseStyles.iconEnd,
                triggerClassName,
              )}
            >
              <span className={collapseStyles.expandIcon} aria-hidden="true">
                {expandIcon ? (
                  expandIcon({ isActive: current.includes(item.key) })
                ) : (
                  <AppIcon
                    icon="chevron-right"
                    className={collapseStyles.chevron}
                  />
                )}
              </span>
              <span className={collapseStyles.label}>{item.label}</span>
            </Accordion.Trigger>
            {item.extra}
          </Accordion.Header>
          <Accordion.Panel
            keepMounted={!destroyInactivePanel && !item.destroyOnHidden}
            className={clsx(collapseStyles.panel, panelClassName)}
          >
            <div className={contentClassName}>{item.children}</div>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
