import styles from "./ItemSettings.module.css";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Flex, Input, InputNumber, Select, Switch } from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import { isEmpty, isNumber, isString } from "lodash-es";

const TextArea = Input.TextArea;
const Option = Select.Option;
const StringModal = (props: any) => {
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
    <div>
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
          <Flex gap={20} justify="space-between">
            <div className={styles.itemLine}>
              <div className={styles.caseTitle}>
                {t("common.schema.advanced_settings.default_values")}
              </div>
              <div className={styles.caseValue}>
                <Input
                  size="small"
                  value={value?.default}
                  onChange={(e) => {
                    onChange("default", e.target.value);
                  }}
                  inputClassName={styles.input}
                />
              </div>
            </div>
            <div className={styles.itemLine}>
              <div className={styles.caseTitle}>Format</div>
              <div className={styles.caseValue}>
                <Select
                  value={isString(value?.format) ? value?.format : ""}
                  onChange={onChange.bind(null, "format")}
                  className={styles.select}
                  triggerClassName={styles.selectTrigger}
                >
                  <Option value={undefined}>{t("common.select_tip")}</Option>
                  <Option value="date-time">date-time</Option>
                  <Option value="date">date</Option>
                  <Option value="email">email</Option>
                  <Option value="hostname">hostname</Option>
                  <Option value="ipv4">ipv4</Option>
                  <Option value="ipv6">ipv6</Option>
                  <Option value="uri">uri</Option>
                </Select>
              </div>
            </div>
          </Flex>
          <Flex gap={20} justify="space-between">
            <div className={styles.itemLine}>
              <div className={styles.caseTitle}>
                {" "}
                {t("common.schema.advanced_settings.min_length")}
              </div>
              <div className={styles.caseValue}>
                <InputNumber
                  size="small"
                  min={0}
                  value={isNumber(value?.minLength) ? value?.minLength : 0}
                  onChange={onChange.bind(null, "minLength")}
                  className={styles.inputNumber}
                />
              </div>
            </div>
            <div className={styles.itemLine}>
              <div className={styles.caseTitle}>
                {" "}
                {t("common.schema.advanced_settings.max_length")}
              </div>
              <div className={styles.caseValue}>
                <InputNumber
                  size="small"
                  min={0}
                  value={isNumber(value?.maxLength) ? value?.maxLength : 0}
                  onChange={onChange.bind(null, "maxLength")}
                  className={styles.inputNumber}
                />
              </div>
            </div>
          </Flex>
        </Flex>
        <div className={styles.itemLine}>
          <div className={styles.caseTitle}>
            <span style={{ paddingRight: 5 }}>
              {" "}
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
              maxTagCount={3}
              style={{ width: "100%" }}
              disabled={value?.apipost_enable_enum !== true}
              mode="tags"
              value={caseValue}
              onChange={(e) => {
                setCaseValue(e);
                onChange(
                  "enum",
                  e?.filter((item: any) => !isEmpty(item)),
                );
              }}
              options={caseValue?.map((e) => ({ label: e, value: e }))}
              className={styles.select}
              triggerClassName={styles.selectTrigger}
            />
          </div>
        </div>
        <div className={styles.itemLine}>
          <div className={styles.caseTitle}>Pattern</div>
          <div className={styles.caseValue}>
            <Input
              size="small"
              className={styles.caseValue}
              value={value?.pattern}
              onChange={(e) => {
                onChange("pattern", e.target.value);
              }}
              inputClassName={styles.input}
            />
          </div>
        </div>

        <div className={styles.itemLine}>
          <div className={styles.caseTitle}>
            {t("common.schema.advanced_settings.remarks")}
          </div>
          <div className={styles.caseValue}>
            <TextArea
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
    </div>
  );
};

export default StringModal;
