import styles from "./ResponseAssert.module.css";
import { useTranslation } from "react-i18next";
import { Flex } from "@/shared/ui/base";
import Dot from "@/shared/ui/Dot";
import type { HttpExecutionState } from "@/features/requests/execution/http-state";
import AssertList from "./AssertList";

export default function ResponseAssert({
  sendingData = {},
  showAssertTitle = true,
}: {
  sendingData?: HttpExecutionState;
  showAssertTitle?: boolean;
}) {
  const { t } = useTranslation();
  const assertions = sendingData.assertions || [];
  const failed =
    !!sendingData.error ||
    assertions.some(
      (item: import("./AssertList").HttpAssertion) => !!item.error,
    );
  return (
    <div className={styles.container}>
      {showAssertTitle && (
        <div className={styles.assertTitle}>
          <Flex align="center" gap={8}>
            <Dot type={failed ? "error" : "success"} />
            {t("common.test_component.title")}
          </Flex>
        </div>
      )}
      <div className={styles.assertPot}>
        {sendingData.error && (
          <div role="alert" className={styles.assertContent}>
            {sendingData.error.message}
          </div>
        )}
        <div className={styles.assertContent}>
          <AssertList asserts={assertions} />
        </div>
      </div>
    </div>
  );
}
