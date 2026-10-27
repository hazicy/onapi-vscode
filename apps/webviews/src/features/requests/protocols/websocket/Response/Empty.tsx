import styles from "./Empty.module.css";
import { useTranslation } from "react-i18next";
import Empty from "@/shared/ui/Empty";
import type { ReactNode } from "react";

type Props = {
  title?: string;
  description?: string;
  children?: ReactNode;
};

export default function ResponseEmpty({ title, description, children }: Props) {
  const { t } = useTranslation();
  return (
    <Empty
      className={styles.container}
      variant="connection"
      description={description || title || t("ws.response.empty_description")}
    >
      {children}
    </Empty>
  );
}
