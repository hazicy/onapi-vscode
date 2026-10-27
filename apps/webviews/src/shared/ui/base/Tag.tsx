import { forwardRef } from "react";
import clsx from "clsx";
import type { TagProps } from "./types";
import tagStyles from "./Tag.module.css";

export const Tag = forwardRef<HTMLSpanElement, TagProps>(
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
      className={clsx(tagStyles.tag, className)}
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
