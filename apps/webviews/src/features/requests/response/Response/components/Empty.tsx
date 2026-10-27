import styles from "./Empty.module.css";
import { useTranslation } from "react-i18next";

import clsx from "clsx";

import AppIcon from "@/shared/ui/AppIcon";

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
      <div
        className={styles.responseEmptyWrap}
        role={errorMessage ? "alert" : "status"}
      >
        <AppIcon
          icon={errorMessage ? "circle-alert" : "send"}
          className={clsx(
            styles.iconEmptyWrap,
            errorMessage && styles.errorIcon,
          )}
        />
        <p className={clsx(styles.emptyDescription, descriptionClassName)}>
          {errorMessage
            ? t("request_panel.failed")
            : description || t("request_panel.send_hint")}
        </p>
        {errorMessage ? (
          <p className={styles.errorMessage}>{errorMessage}</p>
        ) : (
          !description && (
            <p className={styles.shortcut}>
              <kbd>Ctrl / Cmd</kbd> + <kbd>Enter</kbd>
              <span>{t("request_panel.shortcut_hint")}</span>
            </p>
          )
        )}
        {errorMessage && (
          <p className={styles.hint}>{t("request_panel.details")}</p>
        )}
      </div>
    </div>
  );
};

export default ResponseEmpty;
