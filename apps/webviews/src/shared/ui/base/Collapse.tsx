import collapseStyles from "./Collapse.module.css";
import { Accordion } from "@base-ui/react/accordion";
import cx from "classnames";
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
  expandIconPosition,
  ghost,
  bordered = true,
  destroyInactivePanel,
  className,
  rootClassName,
  ...props
}: CollapseProps) {
  return (
    <Accordion.Root
      {...props}
      className={cx(collapseStyles.collapse, className, rootClassName)}
      value={array(activeKey)}
      defaultValue={array(defaultActiveKey)}
      multiple={!accordion}
      onValueChange={(v) => onChange?.(accordion ? v[0] : v)}
    >
      {items.map((item) => (
        <Accordion.Item
          key={String(item.key)}
          value={item.key}
          disabled={item.collapsible === "disabled"}
          className={cx(collapseStyles.item, itemClassName, item.className)}
          style={item.style}
        >
          <Accordion.Header className={headerClassName}>
            <Accordion.Trigger
              className={cx(collapseStyles.trigger, triggerClassName)}
            >
              {item.label}
            </Accordion.Trigger>
            {item.extra}
          </Accordion.Header>
          <Accordion.Panel
            keepMounted={!destroyInactivePanel && !item.destroyOnHidden}
            className={cx(collapseStyles.panel, panelClassName)}
          >
            <div className={contentClassName}>{item.children}</div>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
