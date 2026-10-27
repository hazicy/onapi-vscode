import styles from "./GhostCollapse.module.css";

import type { CollapseProps as BaseCollapseProps } from "@/shared/ui/base";
import { Collapse as BaseCollapse } from "@/shared/ui/base";

import classNames from "classnames";

import AppIcon from "@/shared/ui/AppIcon";
import useTheme from "@/shared/hooks/useTheme";

type GhostCollapseProps = BaseCollapseProps & {
  /**whether header spacing follows content width */
  fitContent?: boolean;
};

const GhostCollapse = ({
  fitContent = true,
  ...restProps
}: GhostCollapseProps) => {
  const { themeToken } = useTheme();

  return (
    <div className={styles.container}>
      <BaseCollapse
        rootClassName={classNames({ [styles.fitContent]: fitContent })}
        expandIcon={({ isActive }) => (
          <AppIcon
            icon="chevron-down"
            style={{ color: themeToken.iconColor }}
            rotate={isActive ? 0 : -90}
          />
        )}
        expandIconPosition="end"
        ghost
        {...restProps}
        contentClassName={styles.collapseContentBox}
        panelClassName={styles.collapseContent}
        triggerClassName={styles.collapseHeaderText}
        headerClassName={styles.collapseHeader}
        itemClassName={styles.collapseItem}
        className={styles.collapse}
      />
    </div>
  );
};

export default GhostCollapse;
