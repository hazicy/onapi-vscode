import styles from "./RawEditor.module.css";
import clsx from "clsx";
import { useContext } from "react";

import { Flex } from "@/shared/ui/base";

import { CodeEditor } from "@/shared/components";

import { ApisBaseRequestBody } from "@onapi/domain/requests/types/request";

import RequestEditorContext from "./requestEditorContext";

import type { EditorOptions } from "@/shared/components/CodeEditor/CodeEditor";

interface Props {
  mode?: string;
  onMountAutoFormat?: boolean;
  value: Partial<ApisBaseRequestBody>;
  onChange: (val: any, key?: string) => void;
  editorOptions?: EditorOptions;
  regularValueHeight?: number;
}

const RawEditor = ({
  mode,
  onMountAutoFormat,
  value,
  onChange,
  editorOptions = {},
  regularValueHeight,
}: Props) => {
  const { isDebugArea = false } = useContext(RequestEditorContext);

  const regularStyle = regularValueHeight
    ? { height: regularValueHeight }
    : !isDebugArea
      ? { height: 380 }
      : {};
  return (
    <div className={clsx(styles.container, "raw-editor-container")}>
      <Flex style={{ width: "100%" }} vertical className={styles.flex}>
        <main>
          <div style={regularStyle} className={styles.paramsFieldEditor}>
            <CodeEditor
              language={mode}
              height={"100%"}
              onMountAutoFormat={onMountAutoFormat}
              value={value?.raw || ""}
              onChange={(raw: string) => onChange({ ...value, raw })}
              options={editorOptions}
            />
          </div>
        </main>
      </Flex>
    </div>
  );
};

export default RawEditor;
