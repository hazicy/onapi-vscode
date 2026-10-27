import type { Page } from "@playwright/test";
import { CodeEditor } from "../../components/CodeEditor";
import type { EditorTestApi } from "../api";

export class EditorPage {
  readonly editor: CodeEditor;

  constructor(readonly page: Page) {
    this.editor = new CodeEditor(page.locator(".code-editor-host"));
  }

  async open() {
    await this.page.goto("/");
    await this.page.waitForFunction(() => Boolean(window.editorTest));
  }

  get content() {
    return this.editor.content;
  }

  get lineNumbers() {
    return this.editor.lineNumbers;
  }

  get completions() {
    return this.page.locator(".cm-tooltip-autocomplete");
  }

  completion(name: string) {
    return this.page.getByRole("option", { name, exact: true });
  }

  get lines() {
    return this.editor.lines;
  }

  get hoverTooltip() {
    return this.page.locator(".cm-tooltip-hover");
  }

  get diffContents() {
    return this.page.locator(".cm-mergeView .cm-content");
  }

  get changedLines() {
    return this.page.locator(".cm-mergeView .cm-changedLine");
  }

  get formattedResponse() {
    return this.page.getByLabel("Formatted response");
  }

  configure(props: Parameters<EditorTestApi["configure"]>[0]) {
    return this.page.evaluate(
      (props) => window.editorTest.configure(props),
      props,
    );
  }

  value() {
    return this.page.evaluate(() => window.editorTest.value());
  }
  changes() {
    return this.page.evaluate(() => window.editorTest.changes());
  }
  isDark() {
    return this.page.evaluate(() => window.editorTest.dark());
  }
  format() {
    return this.page.evaluate(() => window.editorTest.format());
  }

  insert(text: string) {
    return this.page.evaluate((text) => window.editorTest.insert(text), text);
  }

  replaceSelection(from: number, to: number, text: string) {
    return this.page.evaluate(
      ({ from, to, text }) => {
        window.editorTest.select(from, to);
        window.editorTest.insert(text);
      },
      { from, to, text },
    );
  }

  // Start formatting and edit in the same browser task to exercise the race.
  formatThenPrepend(text: string) {
    return this.page.evaluate((text) => {
      void window.editorTest.format();
      window.editorTest.select(0);
      window.editorTest.insert(text);
    }, text);
  }

  diagnostics(source: string) {
    return this.page.evaluate(
      (source) => window.editorTest.jsonDiagnostics(source),
      source,
    );
  }

  setTheme(theme: string) {
    return this.page.evaluate(
      (theme) => window.editorTest.setTheme(theme),
      theme,
    );
  }

  setDiff(diff: Parameters<EditorTestApi["setDiff"]>[0]) {
    return this.page.evaluate((diff) => window.editorTest.setDiff(diff), diff);
  }

  loadLanguage(language: string) {
    return this.page.evaluate(
      (language) => window.editorTest.language(language),
      language,
    );
  }

  formatDocument(source: string, language: string) {
    return this.page.evaluate(
      ({ source, language }) =>
        window.editorTest.formatDocument(source, language),
      { source, language },
    );
  }

  formatResponse(source: string, hint?: string) {
    return this.page.evaluate(
      ({ source, hint }) => window.editorTest.formatResponse(source, hint),
      { source, hint },
    );
  }

  setResponse(response: Parameters<EditorTestApi["setResponse"]>[0]) {
    return this.page.evaluate(
      (response) => window.editorTest.setResponse(response),
      response,
    );
  }

  scrollTo(position: number) {
    return this.page.evaluate(
      (position) => window.editorTest.scrollTo(position),
      position,
    );
  }
}
