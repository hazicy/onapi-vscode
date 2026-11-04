import { useTranslation } from "react-i18next";
import { Input } from "@/shared/ui/base";
import styles from "../Body.module.css";
import type { RequestBodyProps } from "../types";
export default function Binary(props: RequestBodyProps) {
  const { t } = useTranslation();

  return (
    <label className={styles.binaryContent}>
      <span className={styles.fileLabel}>{t("ui.file_path")}</span>
      <Input
        value={props.value?.file?.src || ""}
        placeholder={t("ui.file_path")}
        onChange={(event) =>
          props.onChange("body", {
            ...props.value,
            mode: "file",
            file: { src: event.target.value },
          })
        }
      />
    </label>
  );
}
