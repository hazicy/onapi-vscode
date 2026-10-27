import styles from "../../RequestTable.module.css";
import { FC, memo, useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  AutoComplete,
  Checkbox,
  CheckboxProps,
  Flex,
  Select,
} from "@/shared/ui/base";

import clsx from "clsx";
import { concat, isEqual, map } from "lodash-es";

import AppIcon from "@/shared/ui/AppIcon";
import Tooltip from "@/shared/ui/Tooltip";
import { REQUEST_HEADER } from "@onapi/domain/requests/constants/index";
import { FIELD_TYPES, STATUS_CODE } from "@onapi/domain/constants/common";

import Context from "../../context";
import { ItemProps } from "../../types";

import { useVariableControls } from "@/shared/contexts/variable-controls";

type Props = ItemProps & {
  showAiDescription?: boolean;
  showCheckbox?: boolean;
  inputDisabled?: boolean;
  showFieldType?: boolean;
};

const RowKey: FC<Props> = memo((props) => {
  const {
    rowData,
    rowIndex,
    tabType,
    onChange,
    readOnly,
    bodyMode,
    inputDisabled,
    showAiDescription,
    showCheckbox = true,
    showFieldType = true,
  } = props || {};

  const { t } = useTranslation();

  const { envId } = useContext(Context);
  const { Input: VariableInput } = useVariableControls();

  const finalFieldType = useMemo(() => {
    if (isEqual(tabType, "body") && isEqual(bodyMode, "form-data")) {
      return concat(["File"], FIELD_TYPES);
    }

    return FIELD_TYPES;
  }, [FIELD_TYPES, tabType]);

  const handleChange = (key: string, newVal: string | number) => {
    const newRowData = {
      ...rowData,
      [key]: newVal,
    };

    onChange?.(rowIndex, newRowData);
  };

  const handleChangeNotNull = () => {
    handleChange?.("not_null", rowData.not_null === 1 ? -1 : 1);
  };

  const handleVarInputChange = (val: string) => {
    handleChange?.("key", val);
  };

  const handleFieldTypeChange = (val: string) => {
    handleChange?.("field_type", val);
  };

  const handleChangeChecked: CheckboxProps["onChange"] = (event) => {
    handleChange(
      "is_checked",
      event.target.checked ? STATUS_CODE.ENABLE : STATUS_CODE.DISABLE,
    );
  };

  const suffixIcon = (
    <div onClick={handleChangeNotNull}>
      <AppIcon
        icon="chevron-down"
        style={{ pointerEvents: "none" }}
        className={styles.icon}
      />
      <div
        style={{ pointerEvents: "visible" }}
        className={clsx({
          [styles.required]: true,
          [styles.checked]: rowData?.not_null === 1,
        })}
      >
        <Tooltip title={t("supplement.required")} placement="top">
          <AppIcon
            style={{ fontSize: 14 }}
            icon="braces"
            className={styles.icon}
          />
        </Tooltip>
      </div>
    </div>
  );

  const handleBlur = async (newKey: string) => {
    if (!showAiDescription) {
      return;
    }

    const newRowData = {
      ...rowData,
      key: newKey,
    };

    onChange?.(rowIndex, newRowData);
  };

  return (
    <div className={styles.container}>
      {showCheckbox && (
        <Flex className={styles.checkboxWrap} align="center">
          <Checkbox
            checked={isEqual(rowData?.is_checked, STATUS_CODE.ENABLE)}
            onChange={handleChangeChecked}
            disabled={!!rowData?.static}
          />
        </Flex>
      )}
      {!isEqual(tabType, "header") ? (
        <div className={styles.rowDescription}>
          <VariableInput
            wrapClassName={styles.keyInput}
            envId={envId}
            value={rowData?.key || ""}
            readOnly={readOnly || inputDisabled}
            onChange={handleVarInputChange}
            onBlur={handleBlur}
          />
        </div>
      ) : (
        <AutoComplete
          showArrow
          placeholder="Header-Name"
          filterOption
          value={rowData?.key || ""}
          onChange={handleVarInputChange}
          disabled={readOnly || inputDisabled}
          options={map(REQUEST_HEADER, (item) => ({
            label: item,
            value: item,
          }))}
          arrowClassName={styles.selectArrow}
          triggerClassName={styles.selectTrigger}
          className={styles.select}
        />
      )}
      {!isEqual(tabType, "event") &&
        !isEqual(tabType, "socketio") &&
        showFieldType && (
          <Select
            suffixIcon={suffixIcon}
            value={rowData?.field_type || ""}
            onChange={handleFieldTypeChange}
            disabled={readOnly}
            arrowClassName={styles.selectArrow}
            triggerClassName={styles.selectTrigger}
            className={styles.select}
          >
            {map(finalFieldType, (item) => (
              <Select.Option value={item} key={item} className={styles.select}>
                <span
                  className={clsx(
                    styles.selectFieldTypeOptionItem,
                    styles[
                      `item${item.charAt(0).toUpperCase()}${item.slice(1).toLowerCase()}`
                    ],
                  )}
                >
                  {item}
                </span>
              </Select.Option>
            ))}
          </Select>
        )}
    </div>
  );
});

export default RowKey;
