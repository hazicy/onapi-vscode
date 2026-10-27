import { forwardRef } from "./forwardRef";
import cx from "classnames";
import type { UIProps } from "./types";
import tagStyles from "./Tag.module.css";

export const Tag = forwardRef<HTMLSpanElement, UIProps>(
  (
    {
      children,
      color,
      closable,
      onClose,
      icon,
      bordered = true,
      className,
      style,
      ...props
    },
    ref,
  ) => (
    <span
      {...props}
      ref={ref}
      className={cx(tagStyles.tag, className)}
      style={{ color, ...style }}
    >
      {icon}
      {children}
      {closable && (
        <button type="button" aria-label="Remove tag" onClick={onClose}>
          ×
        </button>
      )}
    </span>
  ),
);
