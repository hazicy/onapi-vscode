import { ChangeEvent, FC, memo } from "react";

import { Input } from "@/shared/ui/base";

import { DataSource } from "../../../types";

interface Props {
  rowData: DataSource;
  rowIndex: number;
  onChange: (rowData: DataSource, rowIndex: number) => void;
}

const RowName: FC<Props> = memo(({ rowData, rowIndex, onChange }) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newRowData = {
      ...rowData,
      name: event.target.value,
    };

    onChange(newRowData, rowIndex);
  };

  return <Input value={rowData.name} onChange={handleChange} />;
});

export default RowName;
