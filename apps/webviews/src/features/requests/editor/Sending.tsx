import styles from "./Sending.module.css";
import React from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import Button from "@/shared/ui/Button";

import useApis from "@/features/requests/store/useApis";

interface SendingProps {
  hasCancel?: boolean;
  onlySendingLoadingBar?: boolean;
  onCancel?: () => void;
}

const Sending: React.FC<SendingProps> = ({
  onlySendingLoadingBar = false,
  hasCancel = true,
  onCancel,
}) => {
  const { t } = useTranslation();
  const updateCurrentSendingData = useApis(
    (store) => store.updateCurrentSendingData,
  );
  const handleCancel = () => {
    updateCurrentSendingData({ sendStatus: "initial" });

    // Terminate the sending thread
    window?.vscode.postMessage({
      action: "stopSendApi",
    });

    onCancel?.();
  };

  return (
    <div
      className={clsx(styles.container, {
        [styles.barOnly]: onlySendingLoadingBar,
      })}
      aria-busy="true"
      role="status"
      aria-label={t("supplement.sending")}
    >
      <div className={styles.sendingLoadingBar} />
      {!onlySendingLoadingBar && hasCancel && (
        <div className={styles.sendingLoadingContent}>
          <Button type="primary" mode="light" onClick={handleCancel}>
            {t("supplement.cancel_send")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Sending;
