import type { ComponentProps, ReactNode } from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import LineTabs from "@/shared/components/LineTabs/LineTabs";
import styles from "./RequestTabs.module.css";

type Props = ComponentProps<typeof LineTabs> & {
  label?: string;
  children?: ReactNode;
};

/** Shared navigation for protocol request and response panels. */
export default function RequestTabs({
  label,
  children,
  items = [],
  activeKey,
  wrapStyle,
  className,
  navClassName,
  tabButtonClassName,
  tabListClassName,
  panelClassName,
  ...props
}: Props) {
  const { t } = useTranslation();
  return (
    <LineTabs
      {...props}
      activeKey={activeKey}
      tabListLabel={label ?? t("request_panel.request_tabs")}
      wrapStyle={{
        display: "flex",
        flexDirection: "column",
        flex: "1 1 0",
        minHeight: 0,
        ...wrapStyle,
      }}
      items={
        children === undefined
          ? items
          : items.map((item) => ({
              ...item,
              children: item.key === activeKey ? children : null,
            }))
      }
      className={clsx(styles.root, className)}
      navClassName={clsx(styles.nav, navClassName)}
      overflowButtonClassName={styles.overflowButton}
      tabButtonClassName={clsx(styles.button, tabButtonClassName)}
      tabListClassName={clsx(styles.list, tabListClassName)}
      panelClassName={clsx(styles.panel, panelClassName)}
    />
  );
}
