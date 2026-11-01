import type { HTMLAttributes } from "react";
import clsx from "clsx";
import styles from "./RequestToolbar.module.css";

type Props = HTMLAttributes<HTMLDivElement> & { as?: "div" | "header" };

/** Protocols supply controls; the row sizing and action alignment stay shared. */
export default function RequestToolbar({
  as: Tag = "div",
  className,
  ...props
}: Props) {
  return (
    <Tag
      {...props}
      data-request-toolbar=""
      className={clsx(styles.toolbar, className)}
    />
  );
}
