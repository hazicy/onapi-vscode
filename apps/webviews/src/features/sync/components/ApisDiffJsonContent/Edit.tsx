import styles from "./index.module.css";
import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, lineNumbers } from "@codemirror/view";
import { useGlobal, useSystemConfig } from "@/app/store";
import {
  editorTheme,
  isDarkTheme,
} from "../../../../shared/components/CodeEditor/theme";

interface Props {
  prevValue: string;
  nextValue: string;
  activeKey?: string;
  isAutoHeight?: boolean;
}

const Edit = ({ prevValue, nextValue, activeKey, isAutoHeight }: Props) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const vscodeTheme = useGlobal((state) => state.vscodeTheme);
  const { font_size, font_family } = useSystemConfig(
    (state) => state.systemConfig,
  );

  useEffect(() => {
    let cancelled = false;
    let destroy: (() => void) | undefined;
    void Promise.all([
      import("@codemirror/merge"),
      import("@codemirror/lang-json"),
    ])
      .then(([{ MergeView }, { json }]) => {
        if (cancelled) {
          return;
        }
        const content = (value: string) => {
          if (activeKey !== "description") {
            return value || "";
          }
          try {
            const parsed = JSON.parse(value);
            return typeof parsed === "string" ? parsed : value;
          } catch {
            return value || "";
          }
        };
        const extensions = [
          json(),
          lineNumbers(),
          EditorView.lineWrapping,
          EditorState.readOnly.of(true),
          EditorView.editable.of(false),
          editorTheme(isDarkTheme(vscodeTheme || ""), font_size, font_family),
        ];
        const merge = new MergeView({
          parent: hostRef.current!,
          a: { doc: content(prevValue), extensions },
          b: { doc: content(nextValue), extensions },
          highlightChanges: true,
          gutter: true,
        });
        destroy = () => merge.destroy();
      })
      .catch((error) => {
        console.error("Failed to load diff editor", error);
      });
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [prevValue, nextValue, activeKey, vscodeTheme, font_size, font_family]);

  return (
    <div
      style={{ height: isAutoHeight ? 460 : 320 }}
      className={styles.versionEdit}
    >
      <div ref={hostRef} className={styles.codeDiffHost} />
    </div>
  );
};

export default Edit;
