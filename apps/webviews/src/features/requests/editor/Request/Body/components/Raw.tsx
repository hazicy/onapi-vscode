import { useTranslation } from "react-i18next";
import RawEditor from "@/shared/components/RawEditor/RawEditor";
import type { RequestBodyProps } from "../types";
export default function Raw(props: RequestBodyProps & { mode?: string }) {
  const { t } = useTranslation();
  return (
    <RawEditor
      mode={props.mode}
      onMountAutoFormat={false}
      value={{ raw: props.value?.raw || "" }}
      onChange={(value) =>
        props.onChange("body", {
          ...props.value,
          mode: "raw",
          raw: value?.raw || "",
        })
      }
      editorOptions={{
        hover: { enabled: true, delay: 500 },
        placeholder:
          props.mode === "json"
            ? t("ui.json_body_placeholder")
            : t("ui.body_placeholder"),
        borderless: true,
        lintGutter: false,
        highlightOnlyWhenFocused: true,
      }}
    />
  );
}
