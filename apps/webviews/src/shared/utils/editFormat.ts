import { formatDocument } from "@/shared/components/CodeEditor/format";
import { normalizeLanguage } from "./normalizeLanguage";

const MAX_FORMAT_BYTES = 5 * 1024 * 1024;

export function responseFormatMode(value: string, hint?: string) {
  if (hint && normalizeLanguage(hint) !== "text") {
    return normalizeLanguage(hint);
  }
  const text = value.trimStart();
  if (/^(?:<!doctype\s+html|<html(?:\s|>))/i.test(text)) {
    return "html";
  }
  if (text.startsWith("<")) {
    return "xml";
  }
  if (/^(?:[\[{]|\/\*|\/\/)/.test(text)) {
    return "json";
  }
  return "text";
}

export async function EditFormat(value: unknown, hint?: string) {
  let source: string;
  try {
    source = typeof value === "string" ? value : (JSON.stringify(value) ?? "");
  } catch {
    return { mode: "text", value: "" };
  }
  const mode = responseFormatMode(source, hint);
  if (
    source.length > MAX_FORMAT_BYTES ||
    new Blob([source]).size > MAX_FORMAT_BYTES
  ) {
    return { mode, value: source };
  }
  let formatted = await formatDocument(source, mode);
  // Preserve JSON5 responses without parsing/re-serializing numeric literals.
  if (mode === "json" && formatted === source) {
    formatted = await formatDocument(source, "json5");
  }
  return { mode, value: formatted };
}
