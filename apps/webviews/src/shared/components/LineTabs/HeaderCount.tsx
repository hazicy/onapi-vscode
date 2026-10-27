import styles from "./LineTabs.module.css";
import type { ReactNode } from "react";
import { isArray, isPlainObject, size } from "lodash-es";

interface Props {
  dataSource?: any;
  customCalcFun?: (dataSource: any) => number;
  label: ReactNode;
}

export default function HeaderCount({
  label,
  dataSource,
  customCalcFun,
}: Props) {
  const count = customCalcFun
    ? customCalcFun(dataSource)
    : isArray(dataSource) || isPlainObject(dataSource)
      ? size(dataSource)
      : 0;

  return (
    <span className={styles.tabsHeaderCount}>
      {label}
      {count > 0 && <span className={styles.tabsCountBadge}>{count}</span>}
    </span>
  );
}
