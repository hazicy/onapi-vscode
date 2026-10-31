import styles from "./Empty.module.css";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import clsx from "clsx";

import Empty from "@/shared/ui/Empty";

type ResponseEmpty = {
  description?: string;
  descriptionClassName?: string;
  maskMode?: boolean;
  wrapClassName?: string;
  errorMessage?: string;
};

const ResponseEmpty = ({
  description,
  descriptionClassName,
  maskMode = false,
  wrapClassName,
  errorMessage,
}: ResponseEmpty) => {
  const { t } = useTranslation();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();
  return (
    <div
      className={clsx(
        styles.container,
        { [styles.maskMode]: maskMode },
        wrapClassName,
      )}
    >
      <Empty
        role={errorMessage ? "alert" : "status"}
        variant={errorMessage ? "error" : "request"}
        className={clsx(styles.empty, errorMessage && styles.errorEmpty)}
        imageClassName={errorMessage ? styles.errorImage : undefined}
        footerClassName={styles.details}
        descriptionClassName={descriptionClassName}
        description={
          errorMessage ? false : description || t("request_panel.send_hint")
        }
      >
        {errorMessage && (
          <div className={styles.errorDetails}>
            <div className={styles.errorRow}>
              <span className={styles.errorTitle}>
                {t("request_panel.failed")}
              </span>
              <button
                type="button"
                className={styles.detailsAction}
                aria-expanded={detailsOpen}
                aria-controls={detailsId}
                onClick={() => setDetailsOpen((open) => !open)}
              >
                {t("request_panel.error_details")}
              </button>
            </div>
            <pre
              id={detailsId}
              hidden={!detailsOpen}
              className={styles.errorMessage}
            >
              {errorMessage}
            </pre>
          </div>
        )}
      </Empty>
    </div>
  );
};

export default ResponseEmpty;
