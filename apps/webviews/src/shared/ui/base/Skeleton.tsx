import clsx from "clsx";
import type { SkeletonProps } from "./types";
import skeletonStyles from "./Skeleton.module.css";

export const Skeleton = Object.assign(
  ({
    loading = true,
    children,
    paragraph,
    active = true,
    ...props
  }: SkeletonProps) =>
    loading ? (
      <div
        {...props}
        className={clsx(
          skeletonStyles.skeleton,
          active && skeletonStyles.active,
          props.className,
        )}
        role="status"
        aria-label="Loading"
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </div>
    ) : (
      children
    ),
  {
    Input: ({ style, ...props }: SkeletonProps) => (
      <span
        {...props}
        className={clsx(props.className, skeletonStyles.skeleton)}
        style={{ width: 120, height: 30, ...style }}
      />
    ),
    Button: ({ style, ...props }: SkeletonProps) => (
      <span
        {...props}
        className={clsx(props.className, skeletonStyles.skeleton)}
        style={{ width: 80, height: 30, ...style }}
      />
    ),
  },
);
