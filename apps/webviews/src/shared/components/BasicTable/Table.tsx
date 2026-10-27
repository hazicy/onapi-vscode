import styles from "./Table.module.css";
import { Table as BaseTable } from "@/shared/ui/base";

import ResizableTable from "./ResizableTable";
import { AnyObject, TableProps } from "./types";

const Table = <DataSource extends AnyObject>(props: TableProps<DataSource>) => {
  const { resizableColEnable } = props;

  let RenderTable = BaseTable;

  if (resizableColEnable) {
    RenderTable = ResizableTable as any;
  }

  return (
    <div className={styles.container}>
      <div className={styles.table}>
        <RenderTable {...props} />
      </div>
    </div>
  );
};

export default Table;
