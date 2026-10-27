import styles from "./FlowResponse.module.css";
import React from "react";

import AppIcon from "@/shared/ui/AppIcon";

interface Props {
  action: string;
}
const IconMap: { [k: string]: React.ReactNode } = {
  connect: (
    <AppIcon
      className={styles.icon}
      icon="check"
      style={{ color: "var(--color-success)" }}
    />
  ),
  disconnect: (
    <AppIcon
      className={styles.icon}
      icon="check"
      style={{ color: "var(--color-success)" }}
    />
  ),
  message: (
    <AppIcon
      className={styles.icon}
      icon="download"
      style={{ color: "var(--color-info)" }}
    />
  ),
  send: (
    <AppIcon
      className={styles.icon}
      icon="download"
      style={{ transform: "rotate(180deg)", color: "var(--color-warning)" }}
    />
  ),
  error: (
    <AppIcon
      className={styles.icon}
      icon="x"
      style={{ color: "var(--color-error)" }}
    />
  ),
  complete: (
    <AppIcon
      className={styles.icon}
      icon="unplug"
      style={{ color: "var(--color-warning)" }}
    />
  ),
};
const WsIcon = (props: Props) => {
  const { action } = props || {};
  return <>{IconMap[action] || null}</>;
};

export default WsIcon;
