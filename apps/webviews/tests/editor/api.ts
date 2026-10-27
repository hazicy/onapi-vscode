import type { Props } from "../../src/shared/components/CodeEditor/CodeEditor";
import type { formatDocument } from "../../src/shared/components/CodeEditor/format";
import type { jsonDiagnostics } from "../../src/shared/components/CodeEditor/jsonDiagnostics";
import type { EditFormat } from "../../src/shared/utils/editFormat";

export interface EditorTestApi {
  configure(props: Partial<Props>): void;
  setMounted(mounted: boolean): void;
  setDiff(diff: { prevValue: string; nextValue: string }): void;
  setTheme(theme: string): void;
  value(): string;
  dark(): boolean;
  changes(): string[];
  select(from: number, to?: number): void;
  scrollTo(position: number): void;
  insert(text: string): void;
  format(): Promise<void>;
  formatDocument: typeof formatDocument;
  formatResponse: typeof EditFormat;
  setResponse(response: { value: string; mode: string }): void;
  jsonDiagnostics: typeof jsonDiagnostics;
  language(name: string): Promise<number>;
}

declare global {
  interface Window {
    editorTest: EditorTestApi;
  }
}
