import styles from "../Body.module.css";
import { useTranslation } from "react-i18next";

import Empty from "@/shared/ui/Empty";

const RequestBodyNone = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.requestBodyContent}>
      <Empty description={t("common.nodata")} />
    </div>
  );
};

export default RequestBodyNone;
