import { FC, memo } from "react";

import { Select } from "@/shared/ui/base";

import i18next from "i18next";

import { DataSource } from "../../../types";

const VARS_TYPE_OPTIONS = [
  { value: "tempVars", label: i18next.t("supplement.var_tmp") },
  { value: "globalVars", label: i18next.t("supplement.var_glo") },
  { value: "envVars", label: i18next.t("supplement.var_env") },
];

interface Props {
  rowData: DataSource;
  rowIndex: number;
  onChange: (rowData: DataSource, rowIndex: number) => void;
}

const RowName: FC<Props> = memo(({ rowData, rowIndex, onChange }) => {
  const handleChange = (value: string) => {
    const newRowData = {
      ...rowData,
      type: value,
    };

    onChange(newRowData, rowIndex);
  };

  return (
    <Select
      placeholder={i18next.t("common.test_component.select_num")}
      style={{ width: 240 }}
      value={rowData.type}
      onChange={handleChange}
      options={VARS_TYPE_OPTIONS}
    />
  );
});

export default RowName;
