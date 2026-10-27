import { parse, printParseErrorCode, type ParseError } from "jsonc-parser";
import type { Diagnostic } from "@codemirror/lint";

export function jsonDiagnostics(value: string): Diagnostic[] {
  if (!value.trim()) {
    return [];
  }
  const errors: ParseError[] = [];
  parse(value, errors, { disallowComments: false, allowTrailingComma: false });
  const relaxed: ParseError[] = [];
  parse(value, relaxed, { disallowComments: false, allowTrailingComma: true });
  return errors.map((error) => ({
    from: error.offset,
    to: Math.min(value.length, error.offset + error.length),
    severity: relaxed.some(
      (other) => other.offset === error.offset && other.error === error.error,
    )
      ? "error"
      : "warning",
    message: printParseErrorCode(error.error),
  }));
}
