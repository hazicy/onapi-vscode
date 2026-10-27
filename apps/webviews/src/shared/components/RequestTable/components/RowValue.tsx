import styles from "../RequestTable.module.css";
import { memo, useContext, useState } from "react";
import { useTranslation } from "react-i18next";

import { AutoComplete, UploadProps, message } from "@/shared/ui/base";
import { REQUEST_CONTENT_TYPE } from "@onapi/domain/requests/constants/index";

import { includes, isEqual } from "lodash-es";
import classNames from "classnames";
import { useVariableControls } from "@/shared/contexts/variable-controls";
import { Button, AppIcon, Upload } from "@/shared/ui";
import { fileTodataUrl } from "@/shared/utils/file";

import Context from "../context";
import { ItemProps } from "../types";

const MAX_SIZE = 5 * 1024 * 1024;

const RowValue = memo((props: ItemProps) => {
  const {
    rowData,
    rowIndex,
    tabType,
    onChange,
    readOnly,
    bodyMode,
    valueSuffix,
  } = props;

  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { envId, fileValue } = useContext(Context);
  const { Input: VariableInput, Insert } = useVariableControls();

  const handleChange = (key: string, newVal: string | number) => {
    const newRowData = {
      ...rowData,
      [key]: newVal,
    };

    onChange?.(rowIndex, newRowData);
  };

  const customRequest: UploadProps["customRequest"] = async (option: any) => {
    //If on web and file size exceeds 5M, block upload
    if (option?.file?.size > MAX_SIZE) {
      message.error(t("supplement.upload_file_large"));
      return;
    }
    let file_base64: any = null;

    //If on web, use base64
    file_base64 = await fileTodataUrl(option?.file);

    let value = "";
    value = option?.file?.name;
    const newRowData = {
      ...rowData,
      value,
      file_name: option?.file?.name,
      file_base64,
    };

    onChange?.(rowIndex, newRowData);
    option.onSuccess(null);
  };

  const handleRemoveFile = () => {
    const newRowData = {
      ...rowData,
      value: "",
      file_name: "",
      file_base64: "",
    };

    onChange?.(rowIndex, newRowData);
    return true;
  };

  const valueChange = (
    str: string,
    target: "value" | "description",
    append: boolean,
  ) => {
    handleChange(target, append ? `${rowData[target] || ""}${str}` : str);
    setOpen(false);
  };

  const suffix =
    valueSuffix && Insert ? (
      <Insert onChange={valueChange} setOpen={setOpen} open={open}>
        <AppIcon
          className={classNames(
            styles.insertIcon,
            { [styles.active]: open },
            styles.icon,
          )}
          icon="variable"
        />
      </Insert>
    ) : undefined;

  return (
    <div className={styles.container}>
      {tabType === "header" &&
      ["content-type", "accept"].includes(rowData.key?.toLowerCase() || "") ? (
        <>
          <AutoComplete
            showArrow
            placeholder="value"
            value={rowData.value || ""}
            disabled={readOnly}
            onChange={(value) => handleChange("value", value)}
            options={REQUEST_CONTENT_TYPE.map((value) => ({
              label: value,
              value,
            }))}
            className={styles.valueSelect}
          />
          {suffix}
        </>
      ) : fileValue === "path" && rowData?.field_type === "File" ? (
        <VariableInput
          value={rowData.value || ""}
          onChange={(src) => onChange?.(rowIndex, { ...rowData, value: src })}
          placeholder="File path"
        />
      ) : isEqual(rowData?.field_type, "File") &&
        isEqual(bodyMode, "form-data") ? (
        <>
          {rowData?.file_name ? (
            <div className={styles.fileNameWrap}>
              <span>{rowData?.file_name}</span>
              <AppIcon
                icon="trash-2"
                onClick={handleRemoveFile}
                className={styles.icon}
              />
            </div>
          ) : (
            <Upload
              disabled={readOnly}
              customRequest={customRequest}
              className={styles.uploadWrapper}
            >
              <Button type="text" className={styles.button}>
                {t("common.request_table.upload")}
              </Button>
            </Upload>
          )}
        </>
      ) : (
        <VariableInput
          suffix={suffix}
          placeholder="value"
          envId={envId}
          disabledReturn={includes(["header", "query", "cookie"], tabType)}
          readOnly={readOnly}
          maxLength={4294967295}
          value={rowData.value || ""}
          onChange={(val) => {
            handleChange?.("value", val);
          }}
        />
      )}
    </div>
  );
});

export default RowValue;
