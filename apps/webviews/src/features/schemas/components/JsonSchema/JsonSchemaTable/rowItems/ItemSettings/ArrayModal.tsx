import styles from "./ItemSettings.module.css";
import { useTranslation } from "react-i18next";

import { Flex, InputNumber, Switch } from "@/shared/ui/base";

import { isNumber } from "lodash-es";

const ArrayModal = (props: any) => {
  const {
    value,
    onChange,
    handleUpdateRequired,
    isRequired,
    empty,
    handleChangeAllowNull,
    SelectTypeDom,
    ItemMockDom,
  } = props;
  const { t } = useTranslation();
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
          <Flex align="center" gap={8}>
            {t("common.schema.advanced_settings.unique_item")}
            <Switch
              size="small"
              checked={value?.uniqueItems}
              onChange={onChange.bind(null, "uniqueItems")}
            />
          </Flex>
        </Flex>
        {ItemMockDom && (
          <Flex gap={20}>
            <div className={styles.itemLine}>
              <div className={styles.caseTitle}>Example</div>
              <div className={styles.caseValue}>{ItemMockDom}</div>
            </div>
          </Flex>
        )}
        <Flex gap={20}>
          <div className={styles.itemLine}>
            <div className={styles.caseTitle}>
              {t("common.schema.advanced_settings.min_item")}
            </div>
            <div className={styles.caseValue}>
              <InputNumber
                size="small"
                min={0}
                value={isNumber(value?.minItems) ? value?.minItems : 0}
                onChange={onChange.bind(null, "minItems")}
                className={styles.inputNumber}
              />
            </div>
          </div>
        </Flex>
        <Flex gap={20}>
          <div className={styles.itemLine}>
            <div className={styles.caseTitle}>
              {t("common.schema.advanced_settings.max_item")}
            </div>
            <div className={styles.caseValue}>
              <InputNumber
                min={0}
                size="small"
                value={isNumber(value?.maxItems) ? value?.maxItems : 0}
                onChange={onChange.bind(null, "maxItems")}
                className={styles.inputNumber}
              />
            </div>
          </div>
        </Flex>
      </div>
    </>
  );
};

export default ArrayModal;
