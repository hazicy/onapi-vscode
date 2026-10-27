import styles from "./AlertText.module.css";
import { Alert } from "@/shared/ui/base";
import clsx from "clsx";
import { FC } from "react";

import { AlertProps } from "@/shared/ui/base";

const AlertText: FC<AlertProps> = (props) => {
  return (
    <Alert
      {...props}
      className={clsx(styles.container, props.className)}
      messageClassName={styles.alertMessage}
    ></Alert>
  );
};
export default AlertText;
