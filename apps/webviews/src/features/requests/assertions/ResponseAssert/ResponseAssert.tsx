import styles from "./ResponseAssert.module.css";
import { useTranslation } from "react-i18next";
import Empty from "@/shared/ui/Empty";
import type { HttpExecutionState } from "@/features/requests/execution/http-state";
import AssertList from "./AssertList";

export default function ResponseAssert({
  sendingData = {},
}: {
  sendingData?: HttpExecutionState;
}) {
  const { t } = useTranslation();
  const assertions = sendingData.assertions || [];
  if (!assertions.length && !sendingData.error) {
    return <Empty description={t("common.test_component.empty")} />;
  }
  return (
    <div className={styles.container}>
      {sendingData.error && (
        <div role="alert" className={styles.scriptError}>
          {sendingData.error.message}
        </div>
      )}
      <AssertList asserts={assertions} />
    </div>
  );
}
