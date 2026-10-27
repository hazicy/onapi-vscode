import styles from "./Cookie.module.css";
import { FC, memo } from "react";

import dayjs from "dayjs";
import { isArray, isEqual, isPlainObject } from "lodash";

import { BasicTable } from "@/shared/components";

import { Tooltip } from "@/shared/ui";

interface Props {
  value: any;
}

const Cookie: FC<Props> = memo(
  ({ value }) => {
    const dataList = () => {
      const list: any[] = [];
      if (isArray(value)) {
        return value;
      }

      if (isPlainObject(value)) {
        Object.entries(value || {}).forEach(
          ([_key, _value]: [string, any], index) => {
            list.push({
              key: `${_key}-${index}`,
              value: `${_value}`,
              name: _key,
            });
          },
        );
      }

      return list;
    };

    const renderItem = (text: string) => {
      return (
        <Tooltip placement="topLeft" title={text}>
          <span className={styles.tableCellSpan}>{text || "-"}</span>
        </Tooltip>
      );
    };

    const columns = [
      {
        width: "15%",
        title: "name",
        dataIndex: "key",
        render: (_: any, rowData: any) =>
          renderItem(rowData.key || rowData.name),
      },
      {
        width: "15%",
        title: "value",
        dataIndex: "value",
        render: (text: string) => renderItem(text),
      },
      {
        width: "15%",
        title: "httpOnly",
        dataIndex: "httpOnly",
        render: (text: boolean) => renderItem(text ? "true" : "false"),
      },
      {
        width: "15%",
        title: "domain",
        dataIndex: "domain",
        render: (text: string) => renderItem(text),
      },
      {
        width: "15%",
        title: "expires",
        dataIndex: "expires",
        render: (text: string) =>
          renderItem(dayjs(text).format("YYYY-MM-DD HH:mm:ss")),
      },
      {
        width: "15%",
        title: "path",
        dataIndex: "path",
        render: (text: string) => renderItem(text),
      },
      {
        title: "secure",
        dataIndex: "secure",
        render: (text: boolean) => renderItem(text ? "true" : "false"),
      },
    ];

    return (
      <div className={styles.container}>
        <BasicTable
          bordered
          rowKey={(record) => record?.cookie_id || record?.key}
          columns={columns}
          dataSource={dataList()}
        />
      </div>
    );
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps),
);

export default Cookie;
