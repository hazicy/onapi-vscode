import clsx from "clsx";
import type { BadgeProps } from "./types";
import badgeStyles from "./Badge.module.css";

export const Badge = ({
  countClassName,

  count,
  status,
  color,
  text,
  children,
  showZero,
  overflowCount = 99,
  className,
  style,
}: BadgeProps) => (
  <span className={clsx(badgeStyles.badge, className)} style={style}>
    {children}
    {status ? (
      <span style={{ color }}>{text}</span>
    ) : (
      (count || showZero) && (
        <sup className={countClassName}>
          {Number(count) > overflowCount ? `${overflowCount}+` : count}
        </sup>
      )
    )}
  </span>
);
