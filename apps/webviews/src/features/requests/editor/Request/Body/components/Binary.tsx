import { Input } from "@/shared/ui/base";
import styles from "../Body.module.css";
import type { RequestBodyProps } from "../types";
export default function Binary(props: RequestBodyProps) {
  return (
    <label className={styles.binaryContent}>
      <span className={styles.fileLabel}>File path</span>
      <Input
        value={props.value?.file?.src || ""}
        placeholder="File path"
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
