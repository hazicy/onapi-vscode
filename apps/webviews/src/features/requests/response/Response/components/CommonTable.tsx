import React from "react";

import { entries, isArray, isPlainObject } from "lodash-es";

import BasicTable from "@/shared/components/BasicTable/BasicTable";
import { AnyObject } from "@onapi/domain/types/common";

interface Props {
  value: any[] | AnyObject;
}

const CommonTable: React.FC<Props> = ({ value }) => {
  const calcValue = (text: string | any[] | undefined) => {
    if (isArray(text)) {
      return text.join(", ");
    }

    if (text) {
      return String(text);
    }

    return "-";
  };

  const dataList = () => {
    const list: any[] = [];

    if (isArray(value)) {
      return value;
    }

    if (isPlainObject(value)) {
      entries(value || {}).forEach(([_key, _value]: [string, any]) => {
        list.push({ key: _key, value: _value });
      });
    }

    return list;
  };

  const columns = [
    {
      width: 200,
      title: "name",
      dataIndex: "key",
      render: (_text: any, rowData: any, _rowIndex: number) => (
        <span>{rowData.key || rowData.name}</span>
      ),
    },
    {
      // width: '50%',
      title: "value",
      dataIndex: "value",
      render: (text: any, _rowData: any, _rowIndex: number) => (
        <span>{calcValue(text)}</span>
      ),
    },
  ];

  return (
    <BasicTable
      bordered
      showHeader={false}
      columns={columns}
      dataSource={dataList()}
    />
  );
};

export default CommonTable;
