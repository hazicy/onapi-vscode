import styles from "./Error.module.css";
import React from "react";
import { useTranslation } from "react-i18next";

import AppIcon from "@/shared/ui/AppIcon";

import { openUrl } from "@/shared/utils/open";

interface ResponseErrorProps {
  errorMessage: string;
  onClose?: (string: "none") => void;
}

const ResponseError: React.FC<ResponseErrorProps> = (props) => {
  const { t } = useTranslation();
  const { errorMessage, onClose } = props;

  // proxy error
  const isRenderErrorMessage = (message: string) => {
    return /connect ECONNREFUSED/.test(message);
  };

  const handleClose = () => {
    onClose?.("none");
  };

  return (
    <div className={styles.container}>
      {onClose && (
        <AppIcon
          icon="circle-x"
          className={styles.closeErrorWrapper}
          onClick={handleClose}
        />
      )}
      <div className={styles.container}>
        {t("supplement.intro_script")}
        <p className={styles.errorStr}>{errorMessage}</p>
        {isRenderErrorMessage(errorMessage) && (
          <p className={[styles.errorStr, styles.proxyError].join(" ")}>
            {t("supplement.proxy_sys_tip")}
          </p>
        )}
        <p className="err-desc-go-index">
          {t("supplement.go")}&nbsp;
          <span onClick={() => openUrl("https://www.echoapi.com/")}>
            https://www.echoapi.com/
          </span>
          &nbsp;{t("supplement.proxy_sys_tip1")}
        </p>
      </div>
    </div>
  );
};

export default ResponseError;
