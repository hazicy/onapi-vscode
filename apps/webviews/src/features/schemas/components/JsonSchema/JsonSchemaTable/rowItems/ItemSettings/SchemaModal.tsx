import styles from "./ItemSettings.module.css";
import { useTranslation } from "react-i18next";

import { Flex, Switch } from "@/shared/ui/base";

const StringModal = (props: any) => {
  const { t } = useTranslation();
  const {
    isRequired,
    handleUpdateRequired,
    handleChangeAllowNull,
    empty,
    SelectTypeDom,
    ItemMockDom,
  } = props;

  return (
    <>
      <div className={styles.schemaSetting}>
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
      </div>
    </>
  );
};

export default StringModal;
