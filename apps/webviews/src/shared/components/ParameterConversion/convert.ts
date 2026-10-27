import JSON5 from "json5";

const text = (value: unknown): string =>
  value === undefined || value === null
    ? ""
    : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);

export function importParameters(source: string) {
  let parsed: unknown;
  try {
    parsed = JSON5.parse(source);
  } catch {
    /* Try key:value lines below. */
  }
  let rows: any[];
  if (Array.isArray(parsed)) {
    rows = parsed;
  } else if (parsed && typeof parsed === "object") {
    rows = Object.entries(parsed).map(([key, value]) => ({ key, value }));
  } else {
    rows = source
      .split(/\r\n|[\r\n]/)
      .filter((line) => line.trim())
      .map((line) => {
        const index = line.indexOf(":");
        const key = (index < 0 ? line : line.slice(0, index)).trim();
        let value = (index < 0 ? line : line.slice(index + 1)).trim();
        try {
          const json = JSON.parse(value);
          if (json && typeof json === "object") {
            value = JSON.stringify(json);
          }
        } catch {
          /* Preserve plain text. */
        }
        return { key, value };
      });
  }
  return rows
    .filter((item) => item?.key && item.key !== "undefined")
    .map((item) => ({
      description: item.description || "",
      is_checked: item.is_checked <= 0 ? -1 : 1,
      key: text(item.key),
      type: item.type === "File" ? "File" : "Text",
      not_null: item.not_null === -1 ? -1 : 1,
      field_type: [
        "Array",
        "Boolean",
        "Date",
        "Function",
        "NaN",
        "Number",
        "Integer",
        "Object",
        "RegExp",
        "String",
        "Undefined",
        "File",
      ].includes(item.field_type)
        ? item.field_type
        : "String",
      value: text(item.value),
    }));
}

export function exportParameters(values: any[], mode = "key-value"): string {
  const rows = (Array.isArray(values) ? values : []).filter(
    (item) => item?.key,
  );
  if (mode === "json-desc") {
    return JSON.stringify(rows, null, "\t");
  }
  if (mode === "json") {
    return JSON.stringify(
      Object.fromEntries(rows.map((item) => [item.key, text(item.value)])),
      null,
      "\t",
    );
  }
  if (mode === "key-value") {
    return rows.map((item) => `${item.key}:${text(item.value)}\n`).join("");
  }
  return "";
}
