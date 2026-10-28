import React, { StrictMode, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { EditorView } from "@codemirror/view";
import CodeEditor, {
  type CodeEditorRef,
  type Props,
} from "../../src/shared/components/CodeEditor/CodeEditor";
import DiffEditor from "./DiffEditor";
import { formatDocument } from "../../src/shared/components/CodeEditor/format";
import { jsonDiagnostics } from "../../src/shared/components/CodeEditor/jsonDiagnostics";
import { loadLanguage } from "../../src/shared/components/CodeEditor/languages";
import { EditorState } from "@codemirror/state";
import { setTheme, useGlobal } from "./store";
import { getEditorVariable } from "./global";
import { EditorPreferencesContext } from "../../src/shared/contexts/editor-preferences";
import { EditFormat } from "../../src/shared/utils/editFormat";
import useEditFormat from "../../src/shared/hooks/useEditFormat";
import type { EditorTestApi } from "./api";

function Fixture() {
  const theme = useGlobal((state) => state.vscodeTheme);
  const [props, setProps] = useState<Props>({
    value: "",
    language: "text",
    onMountAutoFormat: false,
  });
  const [mounted, setMounted] = useState(true);
  const [diff, setDiff] = useState({
    prevValue: '{"a":1}',
    nextValue: '{"a":2}',
  });
  const changes = useRef<string[]>([]);
  const [response, setResponse] = useState({ value: "", mode: "text" });
  const formattedResponse = useEditFormat(response.value, response.mode);
  const editor = useRef<CodeEditorRef>(null);
  const view = () =>
    EditorView.findFromDOM(
      document.querySelector(".code-editor-host .cm-editor")!,
    )!;
  window.editorTest = {
    configure: (next: Partial<Props>) =>
      setProps((previous) => ({ ...previous, ...next })),
    setMounted,
    setDiff,
    setTheme,
    value: () => view().state.doc.toString(),
    dark: () => view().state.facet(EditorView.darkTheme),
    changes: () => changes.current,
    select: (from: number, to = from) =>
      view().dispatch({ selection: { anchor: from, head: to } }),
    scrollTo: (pos: number) =>
      view().dispatch({ selection: { anchor: pos }, scrollIntoView: true }),
    insert: (text: string) => editor.current!.insertText(text),
    format: () => editor.current!.formatEditor(),
    formatDocument,
    formatResponse: EditFormat,
    setResponse,
    jsonDiagnostics,
    language: async (name: string) =>
      EditorState.create({ doc: "{}", extensions: [await loadLanguage(name)] })
        .doc.length,
  } satisfies EditorTestApi;
  return (
    <EditorPreferencesContext.Provider
      value={{
        theme,
        fontSize: 14,
        fontFamily: "monospace",
        lightJsonTheme: false,
        resolveVariable: getEditorVariable,
      }}
    >
      <div className="code-editor-host" style={{ height: 280, width: 700 }}>
        {mounted && (
          <CodeEditor
            {...props}
            ref={editor}
            onChange={(value) => {
              changes.current.push(value);
              setProps((previous) => ({ ...previous, value }));
            }}
          />
        )}
      </div>
      <DiffEditor {...diff} />
      <output
        aria-label="Formatted response"
        data-mode={formattedResponse.mode}
      >
        {formattedResponse.value}
      </output>
    </EditorPreferencesContext.Provider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
);
