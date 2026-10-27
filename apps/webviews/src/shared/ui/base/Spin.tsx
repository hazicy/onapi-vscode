import cx from "classnames";
import type { UIProps } from "./types";
import spinStyles from "./Spin.module.css";

export function Spin({
  contentClassName,

  spinning = true,
  tip,
  children,
  className,
  style,
  size,
}: UIProps) {
  return (
    <div className={cx(spinStyles.host, className)} style={style}>
      {spinning && (
        <div role="status" className={spinStyles.overlay}>
          <span className={spinStyles.spinner} />
          {tip}
        </div>
      )}
      <div
        className={cx(spinStyles.content, contentClassName)}
        aria-busy={spinning}
      >
        {children}
      </div>
    </div>
  );
}
