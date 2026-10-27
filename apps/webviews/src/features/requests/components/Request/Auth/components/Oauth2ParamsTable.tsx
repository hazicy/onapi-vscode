import { useMemo, useRef } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { snowflakeId } from "@onapi/http-model/utils/data-tools";
import { Checkbox, Flex, Select } from "@/shared/ui/base";
import { BasicTable } from "@/shared/components";
import VarInput from "@/features/variables/components/VarInput";
import { AUTH_OAUTH2_SEND_IN } from "@onapi/http-model/requests/constants/auth";

export type DataSourceItem = {
  key: string;
  value: string;
  enabled: boolean;
  send_as: string;
  static?: boolean;
  param_id?: string;
};

interface TableProps {
  value?: DataSourceItem[];
  onChange?: any;
  hasSendIn?: boolean;
}

const DEFAULT_ITEM = {
  key: "",
  value: "",
  send_as: "request_body",
  param_id: "",
  static: true,
  enabled: true,
};

const Oauth2ParamsTable = ({
  value,
  onChange,
  hasSendIn = false,
}: TableProps) => {
  const lastRowDataRef = useRef<DataSourceItem | null>(null);
  const handleItemChange = (rowData: any, index: number, newVal: any) => {
    const newList = [...(value || [])];
    const { static: _placeholder, ...row } = rowData;
    newList[index] = {
      ...row,
      ...newVal,
    };
    onChange?.(newList);
  };

  const columns = [
    {
      title: "",
      width: 24,
      dataIndex: "enabled",
      render: (text: boolean, rowData: DataSourceItem, rowIndex: number) => {
        return (
          <Flex style={{ paddingInline: 4 }} align="center">
            <Checkbox
              checked={text}
              onChange={(e) =>
                handleItemChange(rowData, rowIndex, {
                  enabled: e?.target?.checked,
                })
              }
              disabled={!!rowData?.static}
            />
          </Flex>
        );
      },
    },
    {
      title: "Key",
      width: 150,
      dataIndex: "key",
      render: (text: string, rowData: DataSourceItem, rowIndex: number) => (
        <VarInput
          wrapClassName={"oauth-input"}
          value={text}
          onChange={(e) => {
            handleItemChange(rowData, rowIndex, { key: e });
          }}
        />
      ),
    },
    {
      title: "Value",
      dataIndex: "value",
      render: (text: string, rowData: DataSourceItem, rowIndex: number) => (
        <VarInput
          wrapClassName={"oauth-input"}
          value={text}
          onChange={(e) =>
            handleItemChange(rowData, rowIndex, {
              value: e,
            })
          }
        />
      ),
    },
  ];

  const sendColumns = [
    {
      title: "Send In",
      width: 150,
      dataIndex: "send_as",
      render: (text: string, rowData: DataSourceItem, rowIndex: number) => (
        <Select
          value={text}
          onChange={(e) =>
            handleItemChange(rowData, rowIndex, {
              send_as: e,
            })
          }
          options={AUTH_OAUTH2_SEND_IN}
        />
      ),
    },
  ];

  const tableDataList = useMemo(() => {
    if (value?.some((item) => item.static)) {
      return value;
    }
    if (
      !lastRowDataRef.current ||
      value?.some((item) => item.param_id === lastRowDataRef.current?.param_id)
    ) {
      lastRowDataRef.current = { ...DEFAULT_ITEM, param_id: snowflakeId() };
    }
    return [...(value || []), lastRowDataRef.current];
  }, [value]);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }
    const rows = value || [];
    const activeIndex = rows.findIndex((item) => item.param_id === active.id);
    const overIndex = rows.findIndex((item) => item.param_id === over.id);
    if (activeIndex < 0 || overIndex < 0) {
      return;
    }
    onChange?.(arrayMove(rows, activeIndex, overIndex));
  };

  return (
    <BasicTable
      dragEnable
      onDragEnd={onDragEnd}
      dataSource={tableDataList}
      rowKey="param_id"
      columns={hasSendIn ? [...columns, ...sendColumns] : columns}
      pagination={false}
    />
  );
};

export default Oauth2ParamsTable;
