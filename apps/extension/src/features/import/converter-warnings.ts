import * as vscode from "vscode";
import type { Warning } from "@onapi/api-converter";

export function showConverterWarnings(warnings: Warning[]) {
  if (!warnings.length) {
    return;
  }
  const messages = [...new Set(warnings.map((w) => w.message))];
  void vscode.window.showWarningMessage(
    `Conversion completed with warnings: ${messages.slice(0, 3).join("; ")}${messages.length > 3 ? ` (+${messages.length - 3} more)` : ""}`,
  );
}
