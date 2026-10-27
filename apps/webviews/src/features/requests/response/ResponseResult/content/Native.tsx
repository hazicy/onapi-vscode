import CodeEditor from "@/shared/components/CodeEditor/CodeEditor";
import type { EditorOptions } from "@/shared/components/CodeEditor/CodeEditor";

interface Props {
  rawHtml?: string;
  editorOptions?: EditorOptions;
}
const Native = (props: Props) => {
  const { rawHtml, editorOptions } = props || {};

  return (
    <CodeEditor
      language="text"
      readOnly
      value={rawHtml || ""}
      options={{ ...editorOptions, lineNumbers: "off" }}
    />
  );
};

export default Native;
