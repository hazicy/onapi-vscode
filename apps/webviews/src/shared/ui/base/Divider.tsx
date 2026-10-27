import clsx from "clsx";
import type { DividerProps } from "./types";
import dividerStyles from "./Divider.module.css";
import { Separator } from "@base-ui/react/separator";

export const Divider = ({
  type,
  children,
  dashed,
  orientation,
  className,
  style,
  ...props
}: DividerProps) =>
  children ? (
    <div className={clsx(dividerStyles.divider, className)} style={style}>
      <span />
      {children}
      <span />
    </div>
  ) : (
    <Separator
      {...props}
      orientation={type === "vertical" ? "vertical" : "horizontal"}
      className={clsx(dividerStyles.separator, className)}
      style={style}
    />
  );
