import cx from "classnames";
import type { UIProps } from "./types";
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
}: UIProps) => (
  <span className={cx(badgeStyles.badge, className)} style={style}>
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
