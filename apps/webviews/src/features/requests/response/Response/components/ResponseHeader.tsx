import styles from "./ResponseHeader.module.css";
import { FC, memo } from "react";

import { isArray, isEqual, isPlainObject } from "lodash-es";

import Empty from "@/shared/ui/Empty";
import BasicTable from "@/shared/components/BasicTable/BasicTable";

interface Props {
  value: any;
}

const ResponseHeader: FC<Props> = memo(
  ({ value }) => {
    const dataList = () => {
      const list: any[] = [];
      if (isArray(value)) {
        return value;
      }

      if (isPlainObject(value)) {
        Object.entries(value || {}).forEach(([_key, _value]: [string, any]) => {
          list.push({ key: _key, value: `${_value}` });
        });
      }

      return list;
    };

    const columns = [
      {
        width: "25%",
        title: "name",
        dataIndex: "key",
        render: (_text: any, rowData: any, _rowIndex: number) => (
          <span className={styles.tableCellSpan}>
            {rowData.key || rowData.name}
          </span>
        ),
      },
      {
        width: "75%",
        title: "value",
        dataIndex: "value",
        render: (text: any, _rowData: any, _rowIndex: number) => (
          <span className={styles.tableCellSpan}>{text || "-"}</span>
        ),
      },
    ];
    const rows = dataList();
    if (!rows.length) {
      return <Empty />;
    }

    return (
      <div className={styles.container}>
        <BasicTable
          bordered
          showHeader={false}
          columns={columns}
          dataSource={rows}
        />
      </div>
    );
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps),
);

export default ResponseHeader;
