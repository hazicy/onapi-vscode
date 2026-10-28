import { formatWithOxfmt } from "@/shared/bridge/formatter";
import { normalizeLanguage } from "@/shared/utils/normalizeLanguage";

/** Invalid/unsupported input stays untouched. JSON formatting preserves comments and numeric literals. */
export async function formatDocument(
  value: string,
  language: string,
): Promise<string> {
  if (!value.trim()) {
    return value;
  }
  const name = normalizeLanguage(language);
  if (
    ![
      "javascript",
      "json",
      "json5",
      "typescript",
      "html",
      "css",
      "graphql",
      "yaml",
    ].includes(name)
  ) {
    return value;
  }
  if (sourceTooLarge(value)) {
    return value;
  }
  return formatWithOxfmt(value, name);
}

function sourceTooLarge(value: string) {
  return (
    value.length > 5 * 1024 * 1024 || new Blob([value]).size > 5 * 1024 * 1024
  );
}
