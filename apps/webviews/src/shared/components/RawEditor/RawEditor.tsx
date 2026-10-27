import styles from "./RawEditor.module.css";
import clsx from "clsx";
import { useContext, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Flex } from "@/shared/ui/base";

import { useSafeState } from "ahooks";

import { CodeEditor } from "@/shared/components";
import { useVariableControls } from "@/shared/contexts/variable-controls";

import { Button, AppIcon } from "@/shared/ui";
import { ApisBaseRequestBody } from "@onapi/domain/requests/types/request";

import VisualizationContext from "./visualizationContext";

import type {
  CodeEditorRef,
  EditorOptions,
} from "@/shared/components/CodeEditor/CodeEditor";

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
  const { t } = useTranslation();
  const { Insert } = useVariableControls();

  const codeEditorRef = useRef<CodeEditorRef>(null);

  const { isDebugArea = false } = useContext(VisualizationContext);
  const [varOpen, setVarOpen] = useSafeState(false);

  const valueChange = (str: string) => {
    codeEditorRef.current?.insertText(str);
    setVarOpen(false);
  };

  const regularStyle = regularValueHeight
    ? { height: regularValueHeight }
    : !isDebugArea
      ? { height: 380 }
      : {};
  return (
    <div className={clsx(styles.container, "raw-editor-container")}>
      <Flex style={{ width: "100%" }} vertical className={styles.flex}>
        <header>
          <Flex align="center" justify="space-between" className={styles.flex}>
            <Flex gap={12} align="center" className={styles.flex}>
              {isDebugArea && Insert ? (
                <Flex gap={4} className={styles.flex}>
                  <Insert
                    isInsertDynamic
                    onChange={valueChange}
                    open={varOpen}
                    setOpen={setVarOpen}
                  >
                    <Button
                      className={styles.textBtnHighlight}
                      mode="light"
                      type="text"
                      size="small"
                      icon={<AppIcon icon="variable" className={styles.icon} />}
                    >
                      {t("var_insert.dynamic_value")}
                    </Button>
                  </Insert>
                </Flex>
              ) : (
                <div />
              )}
            </Flex>
          </Flex>
        </header>
        <main>
          <div style={regularStyle} className={styles.paramsFieldEditor}>
            <CodeEditor
              ref={codeEditorRef}
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
