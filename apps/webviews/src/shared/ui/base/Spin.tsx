import clsx from "clsx";
import type { SpinProps } from "./types";
import spinStyles from "./Spin.module.css";

export function Spin({
  contentClassName,

  spinning = true,
  tip,
  children,
  className,
  style,
  size,
}: SpinProps) {
  return (
    <div className={clsx(spinStyles.host, className)} style={style}>
      {spinning && (
        <div role="status" className={spinStyles.overlay}>
          <span className={spinStyles.spinner} />
          {tip}
        </div>
      )}
      <div
        className={clsx(spinStyles.content, contentClassName)}
        aria-busy={spinning}
      >
        {children}
      </div>
    </div>
  );
}
