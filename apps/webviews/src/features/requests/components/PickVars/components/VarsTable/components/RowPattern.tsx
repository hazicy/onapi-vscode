import styles from "../index.module.css";
import { ChangeEvent, FC, memo } from "react";

import { Flex, Input } from "@/shared/ui/base";

import AppIcon from "@/shared/ui/AppIcon";

import { DataSource } from "../../../types";

interface Props {
  rowData: DataSource;
  rowIndex: number;
  onChange: (rowData: DataSource, rowIndex: number) => void;
  onDelete: (rowIndex: number) => void;
}

const RowPattern: FC<Props> = memo(
  ({ rowData, rowIndex, onChange, onDelete }) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const newRowData = {
        ...rowData,
        expression: event.target.value,
      };

      onChange(newRowData, rowIndex);
    };

    return (
      <Flex>
        <Input
          value={rowData.expression}
          onChange={handleChange}
          outlinedClassName={styles.inputOutlined}
        />
        <AppIcon
          className={styles.deleteVarsParamsIcon}
          icon="trash-2"
          onClick={() => onDelete(rowIndex)}
          style={{ padding: "0 10px" }}
        />
      </Flex>
    );
  },
);

export default RowPattern;
