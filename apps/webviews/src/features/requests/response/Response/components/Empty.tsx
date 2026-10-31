import styles from "./Empty.module.css";
import { useTranslation } from "react-i18next";

import clsx from "clsx";

import AppIcon from "@/shared/ui/AppIcon";
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
        variant="request"
        className={styles.empty}
        imageClassName={errorMessage ? styles.errorImage : undefined}
        footerClassName={styles.details}
        image={
          errorMessage ? (
            <AppIcon
              icon="circle-alert"
              className={clsx(styles.iconEmptyWrap, styles.errorIcon)}
            />
          ) : undefined
        }
        descriptionClassName={descriptionClassName}
        description={
          errorMessage
            ? t("request_panel.failed")
            : description || t("request_panel.send_hint")
        }
      >
        {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
        {errorMessage && (
          <p className={styles.hint}>{t("request_panel.details")}</p>
        )}
      </Empty>
    </div>
  );
};

export default ResponseEmpty;
