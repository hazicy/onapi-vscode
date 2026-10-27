import styles from "./index.module.css";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Flex, Input, InputNumber, Select, Switch } from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import { isEmpty, isNumber, trim } from "lodash";

const NumberModal = (props: any) => {
  const {
    value,
    onChange,
    isRequired,
    handleUpdateRequired,
    handleChangeAllowNull,
    empty,
    SelectTypeDom,
    ItemMockDom,
  } = props;
  const { t } = useTranslation();
  const [caseValue, setCaseValue] = useSafeState([]);
  useEffect(() => {
    setCaseValue(value.enum);
  }, [value.enum]);

  return (
    <>
      <div className={styles.baseSetting}>
        <div className={styles.itemLine}>{SelectTypeDom}</div>
        <Flex
          gap={20}
          className={[styles.itemAllLine, styles.itemNecessarily].join(" ")}
        >
          <Flex align="center" gap={8}>
            {t("common.schema.advanced_settings.required")}
            <Switch
              size="small"
              onChange={() => handleUpdateRequired(isRequired)}
              value={isRequired}
            />
          </Flex>
          <Flex align="center" gap={8}>
            {t("common.schema.advanced_settings.null")}
            <Switch
              size="small"
              value={empty}
              onChange={handleChangeAllowNull}
            />
          </Flex>
        </Flex>
        {ItemMockDom && (
          <Flex gap={20}>
            <div className={styles.itemLine}>
              <div className={styles.caseTitle}>example</div>
              <div className={styles.caseValue}>{ItemMockDom}</div>
            </div>
          </Flex>
        )}
        <Flex vertical>
          <div className={styles.itemLine}>
            <div className={styles.caseTitle}>
              {t("common.schema.advanced_settings.default_values")}
            </div>
            <div className={styles.caseValue}>
              <InputNumber
                style={{ width: "100%" }}
                size="small"
                min={-Infinity}
                value={isNumber(value?.default) ? value?.default : 0}
                onChange={onChange.bind(null, "default")}
                className={styles.inputNumber}
              />
            </div>
          </div>
        </Flex>
        <Flex gap={20}>
          <div className={styles.itemLine}>
            <div className={styles.caseTitle}>
              {t("common.schema.advanced_settings.min_value")}
            </div>
            <div className={styles.caseValue}>
              <InputNumber
                size="small"
                style={{ width: "100%" }}
                min={0}
                value={isNumber(value?.minimum) ? value?.minimum : undefined}
                onChange={onChange.bind(null, "minimum")}
                className={styles.inputNumber}
              />
            </div>
          </div>
          <div className={styles.itemLine}>
            <div className={styles.caseTitle}>
              {t("common.schema.advanced_settings.eq_min_value")}
            </div>
            <Switch
              size="small"
              checked={value?.exclusiveMinimum}
              onChange={onChange.bind(null, "exclusiveMinimum")}
            />
          </div>
        </Flex>
        <Flex gap={20}>
          <div className={styles.itemLine}>
            <div className={styles.caseTitle}>
              {t("common.schema.advanced_settings.max_value")}
            </div>
            <div className={styles.caseValue}>
              <InputNumber
                size="small"
                min={0}
                style={{ width: "100%" }}
                value={isNumber(value?.maximum) ? value?.maximum : undefined}
                onChange={onChange.bind(null, "maximum")}
                className={styles.inputNumber}
              />
            </div>
          </div>
          <div className={styles.itemLine}>
            <div className={styles.caseTitle}>
              {t("common.schema.advanced_settings.eq_max_value")}
            </div>
            <Switch
              size="small"
              checked={value?.exclusiveMaximum}
              onChange={onChange.bind(null, "exclusiveMaximum")}
            />
          </div>
        </Flex>

        <div className={styles.itemLine}>
          <div className={styles.caseTitle}>
            <span style={{ paddingRight: 5 }}>
              {t("common.schema.advanced_settings.enum_values")}
            </span>
            <Switch
              size="small"
              checked={value?.apipost_enable_enum === true ? true : false}
              onChange={onChange.bind(
                null,
                "apipost_enable_enum",
                !value?.apipost_enable_enum,
              )}
            />
          </div>
          <div className={styles.caseValue}>
            <Select
              style={{ width: "100%" }}
              disabled={value?.apipost_enable_enum !== true}
              mode="tags"
              value={caseValue}
              onChange={(e) => {
                setCaseValue(e);
                const numberList = [];
                for (const valItem of e) {
                  const parsedValue = !isEmpty(trim(valItem))
                    ? Number(valItem)
                    : null;
                  if (isNumber(parsedValue) && !isNaN(parsedValue)) {
                    numberList.push(parsedValue);
                  }
                }
                onChange("enum", numberList);
              }}
              options={caseValue?.map((e) => ({ label: e, value: e }))}
              className={styles.select}
              triggerClassName={styles.selectTrigger}
            />
          </div>
        </div>
        <div className={styles.itemLine}>
          <div className={styles.caseTitle}>
            {t("common.schema.advanced_settings.remarks")}
          </div>
          <div className={styles.caseValue}>
            <Input.TextArea
              size="small"
              autoSize={{ minRows: 3, maxRows: 3 }}
              value={value?.enumDesc}
              onChange={(e) => {
                onChange("enumDesc", e.target.value);
              }}
              className={styles.textarea}
              inputClassName={styles.input}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default NumberModal;
