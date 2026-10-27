import cx from "classnames";
import type { UIProps } from "./types";
import progressStyles from "./Progress.module.css";

export function Progress({
  percent = 0,
  status,
  type,
  format,
  className,
  style,
}: UIProps) {
  return (
    <div className={cx(progressStyles.progress, className)} style={style}>
      <progress value={percent} max={100} aria-label={status ?? "Progress"} />
      {format ? format(percent) : `${Math.round(percent)}%`}
    </div>
  );
}
