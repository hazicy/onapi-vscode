import styles from "./AlertText.module.css";
import { Alert } from "@/shared/ui/base";
import classNames from "classnames";
import { FC } from "react";

import { AlertProps } from "@/shared/ui/base";

const AlertText: FC<AlertProps> = (props) => {
  return (
    <Alert
      {...props}
      className={classNames(styles.container, props.className)}
      messageClassName={styles.alertMessage}
    ></Alert>
  );
};
export default AlertText;
