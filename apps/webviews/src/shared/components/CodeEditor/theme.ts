import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

export function editorTheme(
  dark: boolean,
  fontSize = 14,
  fontFamily = "monospace",
) {
  return [
    // Webviews expose UI colors, but not the host theme's TextMate token colors.
    // Use VS Code's default token palettes as fallbacks for syntax highlighting.
    syntaxHighlighting(
      HighlightStyle.define([
        { tag: tags.keyword, color: dark ? "#569cd6" : "#0000ff" },
        {
          tag: [tags.string, tags.special(tags.string)],
          color: dark ? "#ce9178" : "#a31515",
        },
        {
          tag: [tags.number, tags.bool, tags.null],
          color: dark ? "#b5cea8" : "#098658",
        },
        {
          tag: [tags.comment, tags.meta],
          color:
            "var(--vscode-descriptionForeground, " +
            (dark ? "#6a9955" : "#008000") +
            ")",
          fontStyle: "italic",
        },
        {
          tag: [tags.typeName, tags.className],
          color: dark ? "#4ec9b0" : "#267f99",
        },
        {
          tag: [
            tags.function(tags.variableName),
            tags.function(tags.propertyName),
          ],
          color: dark ? "#dcdcaa" : "#795e26",
        },
        {
          tag: [tags.variableName, tags.propertyName, tags.attributeName],
          color: dark ? "#9cdcfe" : "#001080",
        },
        { tag: tags.tagName, color: dark ? "#569cd6" : "#800000" },
        {
          tag: [tags.angleBracket, tags.punctuation],
          color:
            "var(--vscode-editor-foreground, " +
            (dark ? "#d4d4d4" : "#000000") +
            ")",
        },
        { tag: tags.invalid, color: "var(--vscode-errorForeground, #f14c4c)" },
      ]),
    ),
    EditorView.theme(
      {
        "&": {
          height: "100%",
          fontSize: `${fontSize}px`,
          color: "var(--vscode-editor-foreground, inherit)",
          backgroundColor:
            "var(--vscode-editor-background, var(--color-bg-right))",
        },
        ".cm-scroller": {
          overflow: "auto",
          fontFamily: fontFamily || "monospace",
        },
        ".cm-content": { minHeight: "100%" },
        ".cm-gutters": {
          backgroundColor:
            "var(--vscode-editorGutter-background, var(--vscode-editor-background, var(--color-bg-right)))",
          color: "var(--vscode-editorLineNumber-foreground, #888)",
          borderRight: "none",
        },
        ".cm-activeLine": {
          backgroundColor:
            "var(--vscode-editor-lineHighlightBackground, transparent)",
        },
        ".cm-activeLineGutter": {
          backgroundColor: "transparent",
          color:
            "var(--vscode-editorLineNumber-activeForeground, var(--vscode-editor-foreground))",
        },
        ".cm-selectionBackground": {
          backgroundColor:
            "var(--vscode-editor-inactiveSelectionBackground, var(--vscode-editor-selectionBackground, Highlight))",
        },
        "&.cm-focused .cm-selectionBackground, .cm-content ::selection": {
          backgroundColor:
            "var(--vscode-editor-selectionBackground, Highlight)",
        },
        ".cm-cursor": {
          borderLeftColor:
            "var(--vscode-editorCursor-foreground, currentColor)",
        },
        ".cm-tooltip": {
          zIndex: "100",
          maxWidth: "min(600px, 90vw)",
          color:
            "var(--vscode-editorHoverWidget-foreground, var(--vscode-editor-foreground))",
          backgroundColor:
            "var(--vscode-editorHoverWidget-background, var(--vscode-editor-background))",
          border:
            "1px solid var(--vscode-editorHoverWidget-border, transparent)",
        },
        ".cm-panels": {
          color:
            "var(--vscode-editorWidget-foreground, var(--vscode-editor-foreground))",
          backgroundColor:
            "var(--vscode-editorWidget-background, var(--vscode-editor-background))",
        },
        ".cm-tooltip-autocomplete": {
          color:
            "var(--vscode-editorSuggestWidget-foreground, var(--vscode-editor-foreground))",
          backgroundColor:
            "var(--vscode-editorSuggestWidget-background, var(--vscode-editor-background))",
          borderColor: "var(--vscode-editorSuggestWidget-border, transparent)",
        },
        ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
          color:
            "var(--vscode-editorSuggestWidget-selectedForeground, var(--vscode-list-activeSelectionForeground))",
          backgroundColor:
            "var(--vscode-editorSuggestWidget-selectedBackground, var(--vscode-list-activeSelectionBackground))",
        },
        ".cm-selectionMatch": {
          backgroundColor:
            "var(--vscode-editor-selectionHighlightBackground, transparent)",
          outline:
            "1px solid var(--vscode-editor-selectionHighlightBorder, transparent)",
        },
        "&.cm-focused .cm-matchingBracket": {
          backgroundColor:
            "var(--vscode-editorBracketMatch-background, transparent)",
          outline:
            "1px solid var(--vscode-editorBracketMatch-border, transparent)",
        },
        ".cm-searchMatch": {
          backgroundColor:
            "var(--vscode-editor-findMatchHighlightBackground, transparent)",
        },
        ".cm-searchMatch.cm-searchMatch-selected": {
          backgroundColor:
            "var(--vscode-editor-findMatchBackground, transparent)",
        },
        "&.cm-focused": { outline: "none" },
      },
      { dark },
    ),
  ];
}

export function isDarkTheme(name: string) {
  return !/light|lighter|powershell ise/i.test(name);
}
