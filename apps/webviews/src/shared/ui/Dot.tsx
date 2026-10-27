import styles from "./Dot.module.css";
import classNames from "classnames";
import { ValueOf } from "type-fest";

const TYPE_MAP = {
  success: "success",
  error: "error",
} as const;

export type DotProps = {
  /**type */
  type?: ValueOf<typeof TYPE_MAP>;
  /**size */
  size?: number;
  /**class name */
  className?: string;
  /**custom color */
  color?: string;
};

const Dot = ({
  size = 8,
  type = TYPE_MAP.success,
  className = "",
  color = "",
}: DotProps) => {
  return (
    <div className={classNames(styles.container, className)}>
      <div
        className={classNames(styles.dot, [{ [TYPE_MAP[type]]: true }])}
        style={{ width: size, height: size, backgroundColor: color }}
      ></div>
    </div>
  );
};

export default Dot;
