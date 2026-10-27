import { useContext } from "react";
import Context from "../context";
import styles from "../RequestTable.module.css";
import { memo } from "react";
import { useTranslation } from "react-i18next";

import { AutoComplete } from "@/shared/ui/base";

import { map } from "lodash-es";

import { REQUEST_CONTENT_TYPE } from "@onapi/http-model/requests/constants/index";

import { ItemProps } from "../types";

const RowContentType = memo((props: ItemProps) => {
  const { t } = useTranslation();
  const { rowData, rowIndex, onChange, readOnly } = props;

  const handleChange = (key: string, newVal: string | number) => {
    const newRowData = {
      ...rowData,
      [key]: newVal,
    };

    onChange?.(rowIndex, newRowData);
  };

  return (
    <div className={styles.container}>
      <AutoComplete
        showArrow
        filterOption
        placeholder={t("common.request_table.content_type_tip")}
        disabled={readOnly}
        value={rowData?.content_type || ""}
        onChange={(value) => handleChange("content_type", value)}
        options={map(REQUEST_CONTENT_TYPE, (item) => ({
          label: item,
          value: item,
        }))}
        arrowClassName={styles.selectArrow}
        triggerClassName={styles.selectTrigger}
        className={styles.select}
      />
    </div>
  );
});

export default RowContentType;
