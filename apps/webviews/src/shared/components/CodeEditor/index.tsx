import styles from "./index.module.css";
import classNames from "classnames";
import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
  Annotation,
  Compartment,
  EditorState,
  Transaction,
  type Extension,
} from "@codemirror/state";
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  hoverTooltip,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
} from "@codemirror/language";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { lintGutter, lintKeymap, linter } from "@codemirror/lint";
import useSystemConfig from "@/features/settings/store/useSystemConfig";
import { useGlobal } from "@/app/store";
import { getEditorVariable } from "@/shared/utils/global";
import { scriptCompletions } from "./completion";
import { formatDocument } from "./format";
import { jsonDiagnostics } from "./jsonDiagnostics";
import { loadLanguage, normalizeLanguage } from "./languages";
import { editorTheme, isDarkTheme } from "./theme";

export interface EditorOptions {
  wordWrap?: "on" | "off";
  lineNumbers?: "on" | "off";
  hover?: { enabled?: boolean; delay?: number };
}

export interface Props {
  className?: string;
  height?: string | number;
  language?: string;
  readOnly?: boolean;
  onMountAutoFormat?: boolean;
  value: string;
  options?: EditorOptions;
  onChange?: (value: string) => void;
}

export interface CodeEditorRef {
  formatEditor: () => Promise<void>;
  insertText: (text: string) => void;
}

const externalChange = Annotation.define<boolean>();

const CodeEditor = forwardRef<CodeEditorRef, Props>((props, ref) => {
  const {
    className,
    height = "100%",
    value,
    language = "text",
    readOnly = false,
    options,
    onMountAutoFormat = true,
  } = props;
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const latest = useRef(props);
  latest.current = props;
  const compartments = useMemo(
    () => ({ language: new Compartment(), config: new Compartment() }),
    [],
  );
  const vscodeTheme = useGlobal((state) => state.vscodeTheme);
  const { font_size, font_family } = useSystemConfig(
    (state) => state.systemConfig,
  );

  const formatEditor = async (automatic = false) => {
    const view = viewRef.current;
    if (!view || (!automatic && view.state.readOnly)) {
      return;
    }
    const doc = view.state.doc;
    const formattingLanguage = latest.current.language || "text";
    const formatted = await formatDocument(doc.toString(), formattingLanguage);
    // Lazy formatter loading must never overwrite typing, a new response, or an unmounted editor.
    if (
      viewRef.current !== view ||
      view.state.doc !== doc ||
      formatted === doc.toString() ||
      (latest.current.language || "text") !== formattingLanguage ||
      (!automatic && view.state.readOnly)
    ) {
      return;
    }
    view.dispatch({
      changes: { from: 0, to: doc.length, insert: formatted },
      selection: {
        anchor: Math.min(view.state.selection.main.head, formatted.length),
      },
      annotations: automatic
        ? [externalChange.of(true), Transaction.addToHistory.of(false)]
        : Transaction.userEvent.of("input.format"),
    });
  };

  useImperativeHandle(ref, () => ({
    formatEditor: () => formatEditor(),
    insertText: (text) => {
      const view = viewRef.current;
      if (!view || view.state.readOnly) {
        return;
      }
      view.dispatch(view.state.replaceSelection(text), {
        scrollIntoView: true,
        userEvent: "input",
      });
      view.focus();
    },
  }));

  useEffect(() => {
    const view = new EditorView({
      parent: hostRef.current!,
      state: EditorState.create({
        doc:
          latest.current.value === null || latest.current.value === undefined
            ? ""
            : String(latest.current.value),
        extensions: [
          history(),
          drawSelection(),
          bracketMatching(),
          indentOnInput(),
          closeBrackets(),
          highlightSelectionMatches(),
          autocompletion(),
          keymap.of([
            {
              key: "Alt-Shift-f",
              run: () => {
                void formatEditor();
                return true;
              },
            },
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            ...searchKeymap,
            ...foldKeymap,
            ...completionKeymap,
            ...lintKeymap,
            indentWithTab,
          ]),
          compartments.language.of([]),
          compartments.config.of([]),
          EditorView.updateListener.of((update) => {
            if (
              update.docChanged &&
              !update.transactions.every((tr) => tr.annotation(externalChange))
            ) {
              latest.current.onChange?.(update.state.doc.toString());
            }
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      viewRef.current = null;
      view.destroy();
    };
  }, [compartments]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }
    const next = value === null || value === undefined ? "" : String(value);
    if (next !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: next },
        annotations: [
          externalChange.of(true),
          Transaction.addToHistory.of(false),
        ],
      });
    }
  }, [value]);

  useEffect(() => {
    const view = viewRef.current!;
    let cancelled = false;
    const name = normalizeLanguage(language);
    view.dispatch({ effects: compartments.language.reconfigure([]) });
    void loadLanguage(name)
      .then((support) => {
        if (cancelled || viewRef.current !== view) {
          return;
        }
        const extensions: Extension[] = [support];
        if (name === "javascript" || name === "typescript") {
          extensions.push(
            EditorState.languageData.of(() => [
              { autocomplete: scriptCompletions },
            ]),
          );
        }
        if (name === "json" && !readOnly) {
          extensions.push(
            linter((v) => jsonDiagnostics(v.state.doc.toString())),
            lintGutter(),
          );
        }
        view.dispatch({
          effects: compartments.language.reconfigure(extensions),
        });
      })
      .catch((error) => {
        console.error("Failed to load editor language", error);
      });
    return () => {
      cancelled = true;
    };
  }, [language, readOnly, compartments]);

  useEffect(() => {
    const view = viewRef.current!;
    const config: Extension[] = [
      EditorState.readOnly.of(readOnly),
      EditorView.editable.of(!readOnly),
      EditorView.contentAttributes.of({
        tabindex: "0",
        "aria-label": "Code editor",
      }),
      EditorState.tabSize.of(2),
      editorTheme(
        isDarkTheme(vscodeTheme || ""),
        typeof font_size === "number" ? font_size : 14,
        font_family || "monospace",
      ),
    ];
    if (options?.wordWrap !== "off") {
      config.push(EditorView.lineWrapping);
    }
    if (options?.lineNumbers !== "off") {
      config.push(lineNumbers(), highlightActiveLineGutter(), foldGutter());
    }
    if (!readOnly) {
      config.push(highlightActiveLine());
    }
    if (options?.hover?.enabled) {
      config.push(
        hoverTooltip(
          async (editor, pos) => {
            const line = editor.state.doc.lineAt(pos);
            for (const match of line.text.matchAll(/\{\{[^{}\n]+\}\}/g)) {
              const from = line.from + match.index!;
              const to = from + match[0].length;
              if (pos < from || pos > to) {
                continue;
              }
              const content = await getEditorVariable(match[0]);
              if (!content) {
                return null;
              }
              return {
                pos: from,
                end: to,
                above: true,
                create: () => {
                  const dom = document.createElement("div");
                  dom.style.cssText =
                    "padding:6px 10px;white-space:pre-wrap;overflow-wrap:anywhere";
                  dom.textContent = content.replace(/\*\*/g, "");
                  return { dom };
                },
              };
            }
            return null;
          },
          { hoverTime: options.hover.delay ?? 500 },
        ),
      );
    }
    view.dispatch({ effects: compartments.config.reconfigure(config) });
  }, [readOnly, options, vscodeTheme, font_size, font_family, compartments]);

  useEffect(() => {
    if (onMountAutoFormat) {
      void formatEditor(true);
    }
  }, [language, onMountAutoFormat]);

  return (
    <div style={{ height }} className={styles.container}>
      <div
        className={[styles.codeEditorHost, className].filter(Boolean).join(" ")}
        ref={hostRef}
      />
    </div>
  );
});

export default memo(CodeEditor);
