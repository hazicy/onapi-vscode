export interface VariableCompletion {
  insertionIndex: number;
  replacementEnd: number;
  query: string;
}

export function findVariableCompletion(
  value: string,
  selectionStart: number,
  selectionEnd = selectionStart,
): VariableCompletion | null {
  if (selectionStart !== selectionEnd) {
    return null;
  }
  const match = /\{\{([^{}\r\n|]*)$/.exec(value.slice(0, selectionStart));
  if (!match) {
    return null;
  }
  const remainingName = /^[^{}\r\n|]*/.exec(value.slice(selectionStart))![0];
  return {
    insertionIndex: match.index + 2,
    replacementEnd: selectionStart + remainingName.length,
    query: match[1],
  };
}

export function completeVariable(
  value: string,
  range: VariableCompletion,
  name: string,
) {
  const suffix = value.slice(range.replacementEnd);
  const existingClosing = /^\}{1,2}/.exec(suffix)?.[0].length ?? 0;
  const closing = suffix.startsWith("|") ? "" : "}".repeat(2 - existingClosing);
  const text = name + closing;
  return {
    value: value.slice(0, range.insertionIndex) + text + suffix,
    caret: range.insertionIndex + text.length + existingClosing,
  };
}
