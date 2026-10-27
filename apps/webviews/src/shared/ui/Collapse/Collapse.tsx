import styles from "./Collapse.module.css";
import { useMemo, type CSSProperties } from "react";

import { Collapse as BaseCollapse } from "@/shared/ui/base";

import AppIcon from "@/shared/ui/AppIcon";
import useTheme from "@/shared/hooks/useTheme";

import { CollapseProps } from "./types";

const Collapse = (props: CollapseProps) => {
  const { themeToken } = useTheme();
  const {
    marginBottom = themeToken.margin12,
    borderRadius = themeToken.borderRadius,
    headerPadding = `${themeToken.padding8}px ${themeToken.padding12}px`,
    bordered = false,
    items,
    ...restProps
  } = props;

  const newItems = useMemo(() => {
    if (items) {
      return items.map((item) => {
        const style = {
          ...item.style,
          marginBottom,
          borderRadius,
          border: bordered ? `1px solid ${themeToken.colorBorder}` : "none",
        };
        return { ...item, style };
      });
    }
  }, [items, marginBottom, themeToken, bordered, borderRadius]);

  return (
    <div
      className={styles.container}
      style={{ "--collapse-header-padding": headerPadding } as CSSProperties}
    >
      <BaseCollapse
        expandIcon={({ isActive }) => (
          <AppIcon icon="chevron-down" rotate={isActive ? 0 : -90} />
        )}
        {...restProps}
        bordered={false}
        items={newItems}
        style={{ ...restProps.style }}
        panelClassName={styles.collapseContent}
        headerClassName={styles.collapseHeader}
        triggerClassName={styles.collapseTrigger}
        className={styles.collapse}
      />
    </div>
  );
};

export default Collapse;
