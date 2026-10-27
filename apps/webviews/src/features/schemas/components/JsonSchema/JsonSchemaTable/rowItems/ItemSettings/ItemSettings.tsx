import styles from "./ItemSettings.module.css";
import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { Flex, Popconfirm, Segmented, Select, message } from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import clsx from "clsx";
import { isNumber, isObject, isUndefined, toLower } from "lodash-es";

import CodeEditor from "@/shared/components/CodeEditor/CodeEditor";
import Button from "@/shared/ui/Button";
import AppIcon from "@/shared/ui/AppIcon";
import Tooltip from "@/shared/ui/Tooltip";
import { copyStringToClipboard } from "@/shared/utils/common";
import { openUrl } from "@/shared/utils/open";

import { ITEM_TYPES } from "../ItemKey/constant";
import ItemMock from "../ItemMock";
import ArrayModal from "./ArrayModal";
import BooleanModal from "./BooleanModal";
import NumberModal from "./NumberModal";
import SchemaModal from "./SchemaModal";
import StringModal from "./StringModal";

const MODALPAGES: any = {
  string: StringModal,
  number: NumberModal,
  integer: NumberModal,
  boolean: BooleanModal,
  array: ArrayModal,
  oneOf: SchemaModal,
  anyOf: SchemaModal,
  allOf: SchemaModal,
  object: SchemaModal,
  schema: SchemaModal,
  null: SchemaModal,
};

const ItemSettings = (props: any, ref: any) => {
  const {
    value,
    onChange,
    modalType,
    showSettings,
    isRequired,
    handleUpdateRequired,
    empty,
    handleChangeAllowNull,
    renderChild,
    handleChangeType,
    onChangeMock,
    mockDisable,
    overrideData,
    deepIndex,
    isModelItem,
    mockValue,
  } = props;
  const { t } = useTranslation();
  const [tempValue, setTempValue] = useState(value);
  const [activeTab, setActiveTab] = useSafeState<string | number>("dataModel");

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const options = useMemo(() => {
    const opt = [
      {
        value: "dataModel",
        label: t("common.schema.advanced_settings.set"),
      },
      {
        value: "schema",
        label: t("common.schema.advanced_settings.edit_code"),
      },
    ];
    return opt;
  }, []);

  const handleChange = (attrName: string, newValue: any) => {
    const newVal = newValue;
    const newData = { ...tempValue };
    newData[attrName] = newVal;
    if (attrName === "apipost_enable_enum" && newVal === false) {
      newData.apipost_enable_enum = undefined;
      newData.enum = undefined;
    }
    if (attrName === "format" && newValue === "") {
      delete newData.format;
    }

    setTempValue(newData);
  };

  const handleChangeRaw = (val: string) => {
    let jsonData;
    try {
      jsonData = JSON.parse(val);
    } catch (ex) {}
    if (isObject(jsonData)) {
      setTempValue(jsonData);
    }
  };

  const handleSaveChanges = () => {
    if (value.type === "integer") {
      if (tempValue?.enum?.some((d: any) => !isNumber(d))) {
        message.error(t("supplement.enum_invalid"));
        return;
      }
    }
    onChange(tempValue);
    //setModalType(null);
  };

  useImperativeHandle(ref, () => {
    return {
      handleSaveChanges,
    };
  });

  const beautifyText = useMemo(() => {
    try {
      return isObject(tempValue) ? JSON.stringify(tempValue, null, 2) : "";
    } catch (ex) {
      return JSON.stringify(tempValue);
    }
  }, [tempValue]);

  const computedActiveTab = activeTab;

  const ModalPage = MODALPAGES[modalType];

  const SelectTypeDom = (
    <Select
      style={{ width: "100%" }}
      value={value.type}
      size="small"
      onChange={handleChangeType}
      className={styles.select}
      triggerClassName={styles.selectTrigger}
    >
      {ITEM_TYPES.map((d: string) => (
        <Select.Option
          value={d}
          key={d}
          className={styles.select}
          triggerClassName={styles.selectTrigger}
        >
          <span className={styles[d] ?? d}>{toLower(d)}</span>
        </Select.Option>
      ))}
    </Select>
  );
  const ItemMockDom = (
    <ItemMock
      disabled={mockDisable}
      deepIndex={deepIndex}
      isModelItem={isModelItem}
      overrideData={overrideData}
      value={mockValue}
      onChange={onChangeMock}
    />
  );

  if (isUndefined(ModalPage)) {
    return <></>;
  }

  return (
    <>
      <Popconfirm
        overlayStyle={{ width: 400 }}
        placement="rightTop"
        destroyTooltipOnHide
        okButtonProps={{ className: styles.confirmButton }}
        cancelButtonProps={{ className: styles.confirmButton }}
        // getTooltipContainer={(triggerNode: HTMLElement) => triggerNode.parentNode as HTMLElement}
        title={null}
        description={
          <div className={styles.container}>
            <Flex style={{ minHeight: 300 }} vertical>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Segmented
                  onChange={(e: string | number) => setActiveTab(e)}
                  value={computedActiveTab}
                  options={options}
                  className={styles.segmented}
                  itemClassName={styles.segmentedItem}
                />
              </div>

              {computedActiveTab === "dataModel" && (
                <div style={{ width: "100%" }}>
                  <ModalPage
                    SelectTypeDom={SelectTypeDom}
                    ItemMockDom={mockDisable ? null : ItemMockDom}
                    handleUpdateRequired={handleUpdateRequired}
                    handleChangeAllowNull={handleChangeAllowNull}
                    isRequired={isRequired}
                    empty={empty}
                    value={tempValue}
                    onChange={handleChange}
                  />
                </div>
              )}
              {computedActiveTab === "schema" && (
                <div className={styles.sourceSetting}>
                  <CodeEditor
                    height={230}
                    value={beautifyText}
                    onChange={(e: string) => {
                      handleChangeRaw(e);
                    }}
                  />
                </div>
              )}
            </Flex>
            <Flex className={styles.sourceHelp} align="center">
              <Flex
                onClick={() =>
                  openUrl(
                    "https://www.echoapi.com/wiki/docs/schema/create#advanced-field-settings",
                  )
                }
                className={styles.sourceTip}
                gap={2}
              >
                <Tooltip title={t("supplement.help")}>
                  <AppIcon icon="info" />
                </Tooltip>
              </Flex>
              <Button
                style={{
                  visibility:
                    computedActiveTab === "schema" ? "visible" : "hidden",
                  marginRight: 4,
                }}
                type="text"
                size="small"
                mode="background"
                onClick={() => copyStringToClipboard(beautifyText)}
              >
                {t("common.schema.advanced_settings.copy")}
              </Button>
            </Flex>
          </div>
        }
        onConfirm={handleSaveChanges}
        icon={null}
        okText={t("common.schema.advanced_settings.confirm")}
        cancelText={t("common.schema.advanced_settings.cancel")}
      >
        <div className={styles.settingContent}>
          {showSettings && renderChild}
        </div>
      </Popconfirm>
    </>
  );
};

export default React.forwardRef(ItemSettings);
