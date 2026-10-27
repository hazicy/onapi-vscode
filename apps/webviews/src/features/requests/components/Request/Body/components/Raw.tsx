import RawEditor from "@/shared/components/RawEditor";
import type { RequestBodyProps } from "../types";
export default function Raw(props: RequestBodyProps & { mode?: string }) {
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
      editorOptions={{ hover: { enabled: true, delay: 500 } }}
    />
  );
}
