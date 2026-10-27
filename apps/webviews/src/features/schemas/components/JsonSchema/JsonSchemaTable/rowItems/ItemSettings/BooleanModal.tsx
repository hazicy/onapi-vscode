import styles from "./ItemSettings.module.css";
import { useTranslation } from "react-i18next";

import { Flex, Select, Switch } from "@/shared/ui/base";

const Option = Select.Option;
const BooleanModal = (props: any) => {
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
        </Flex>
        {ItemMockDom && (
          <Flex gap={20}>
            <div className={styles.itemLine}>
              <div className={styles.caseTitle}>example</div>
              <div className={styles.caseValue}>{ItemMockDom}</div>
            </div>
          </Flex>
        )}
        <div className={styles.itemLine}>
          <div className={styles.caseTitle}>
            {t("common.schema.advanced_settings.default_values")}
          </div>
          <div className={styles.caseValue}>
            <Select
              value={value?.default}
              style={{ width: "100%" }}
              onChange={onChange.bind(null, "default")}
              className={styles.select}
              triggerClassName={styles.selectTrigger}
            >
              <Option value>true</Option>
              <Option value={false}>false</Option>
            </Select>
          </div>
        </div>
      </div>
    </>
  );
};

export default BooleanModal;
