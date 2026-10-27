import styles from "./VarsTable.module.css";
import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Flex, Space } from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import { find, isEmpty, isEqual, isUndefined } from "lodash-es";

import BasicTable from "@/shared/components/BasicTable/BasicTable";
import { ColumnsType } from "@/shared/components/BasicTable/types";
import PathPickModal from "@/shared/components/PathPickModal";
import AppIcon from "@/shared/ui/AppIcon";
import Tooltip from "@/shared/ui/Tooltip";
import useEditTable from "@/shared/hooks/useEditTable";

import { SOCKET_PICK_VARS_TYPES } from "../../constants";
import { DataSource } from "../../types";
import RowName from "./components/RowName";
import RowPattern from "./components/RowPattern";
import RowType from "./components/RowType";

const DEFAULT_ROW_DATA_ITEM = {
  param_id: "",
  name: "",
  expression: "",
  type: undefined,
  static: true,
};

interface Props {
  source: string;
  data: DataSource[];
  onChange: (value: DataSource[]) => void;
}

const VarsTable: FC<Props> = ({ source, data, onChange }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useSafeState(false);

  const handlePickVar = () => {
    setIsOpen(true);
  };

  const handleAddStaticCondition = (rowData: DataSource) => {
    return (
      !isEmpty(rowData?.name) &&
      !isUndefined(rowData?.type) &&
      !isEmpty(rowData?.expression)
    );
  };

  const { tableDataList, handleChangeRowItem, handleDeleteRow, handleDragEnd } =
    useEditTable({
      dataSource: data,
      onChange: (value) => onChange(value),
      defaultRowDataItem: DEFAULT_ROW_DATA_ITEM,
      addStaticCondition: handleAddStaticCondition,
    });

  const calcTableTitle = (source: string) => {
    const target = find(
      SOCKET_PICK_VARS_TYPES,
      (item) => item.value === source,
    );
    if (target?.tableTitle) {
      return (
        <Space>
          {target?.tableTitle}
          {target?.tableTip && (
            <Tooltip title={target?.tableTip}>
              <AppIcon icon="circle-help" />
            </Tooltip>
          )}
        </Space>
      );
    }
    return "";
  };

  const columns: ColumnsType<DataSource>[] = useMemo(
    () => [
      {
        title: t("common.set_variables.variables_tip"),
        dataIndex: "name",
        key: "name",
        width: 150,
        render: (_value, record, index) => (
          <RowName
            rowData={record}
            rowIndex={index}
            onChange={handleChangeRowItem}
          />
        ),
      },
      {
        title: t("common.set_variables.variables_type"),
        width: 150,
        dataIndex: "type",
        key: "type",
        render: (_value, record, index) => (
          <RowType
            rowData={record}
            rowIndex={index}
            onChange={handleChangeRowItem}
          />
        ),
      },
      {
        title: () => (
          <Flex justify="space-between">
            {calcTableTitle(source)}
            <AppIcon
              className={styles.toolIcon}
              icon="wrench"
              onClick={handlePickVar}
            />
          </Flex>
        ),
        dataIndex: "expression",
        key: "expression",
        render: (_value, record, index) =>
          isEqual(source, "responseTime") ? (
            <div style={{ padding: "6.6px 11px" }}>{t("supplement.times")}</div>
          ) : (
            <RowPattern
              rowData={record}
              rowIndex={index}
              onChange={handleChangeRowItem}
              onDelete={handleDeleteRow}
            />
          ),
      },
    ],
    [handleChangeRowItem, source],
  );

  return (
    <div className={styles.container}>
      <BasicTable<DataSource>
        resetPadding
        dragEnable
        bordered
        cellPadding={0}
        rowKey="param_id"
        dataSource={tableDataList}
        columns={columns}
        onDragEnd={handleDragEnd}
      />
      <PathPickModal
        type={isEqual(source, "responseJson") ? "json" : "xml"}
        open={isOpen}
        onCancel={() => setIsOpen(false)}
      />
    </div>
  );
};

export default VarsTable;
