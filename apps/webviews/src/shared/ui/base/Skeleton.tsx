import clsx from "clsx";
import type { UIProps } from "./types";
import skeletonStyles from "./Skeleton.module.css";

export const Skeleton = Object.assign(
  ({ loading = true, children, paragraph, active, ...props }: UIProps) =>
    loading ? (
      <div
        {...props}
        className={clsx(skeletonStyles.skeleton, props.className)}
        aria-label="Loading"
      >
        {Array.from({ length: paragraph?.rows ?? 3 }, (_, i) => (
          <span key={i} />
        ))}
      </div>
    ) : (
      children
    ),
  {
    Input: ({ style, ...props }: UIProps) => (
      <span
        {...props}
        className={clsx(props.className, skeletonStyles.skeleton)}
        style={{ width: 120, height: 30, ...style }}
      />
    ),
    Button: ({ style, ...props }: UIProps) => (
      <span
        {...props}
        className={clsx(props.className, skeletonStyles.skeleton)}
        style={{ width: 80, height: 30, ...style }}
      />
    ),
  },
);
