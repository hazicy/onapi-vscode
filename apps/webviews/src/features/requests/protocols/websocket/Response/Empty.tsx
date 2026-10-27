import styles from "./Empty.module.css";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import messagesSquare from "@iconify-icons/lucide/messages-square";
import type { ReactNode } from "react";

type Props = {
  title?: string;
  description?: string;
  children?: ReactNode;
};

export default function ResponseEmpty({ title, description, children }: Props) {
  const { t } = useTranslation();
  return (
    <div className={styles.container}>
      <span className={styles.icon} aria-hidden="true">
        <Icon icon={messagesSquare} />
      </span>
      <strong className={styles.title}>
        {title || t("ws.response.empty_title")}
      </strong>
      <p className={styles.description}>
        {description || t("ws.response.empty_description")}
      </p>
      {children}
    </div>
  );
}
