import { includes } from "lodash-es";

export const liquidLiteral = (value: unknown): string => {
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value === null || value === undefined) {
    return "nil";
  }
  const text =
    Array.isArray(value) || typeof value === "object"
      ? JSON.stringify(value)
      : String(value);
  return JSON.stringify(text);
};

export const transFuncName = (name: string, value: any) => {
  const args = value?.[name] || {};
  switch (name) {
    case "lower":
      return "downcase";
    case "upper":
      return "upcase";
    case "length":
      return "size";
    case "substr":
      return `slice: ${args.start ?? 0}${args.length === null || args.length === undefined ? "" : `, ${args.length}`}`;
    case "sha":
      return args.text || "sha1";
    case "concat":
      return `append: ${liquidLiteral(args.text || "")}`;
    case "lconcat":
      return `prepend: ${liquidLiteral(args.text || "")}`;
    case "padStart":
      return `pad_start: ${args.length ?? 0}, ${liquidLiteral(args.text || " ")}`;
    case "padEnd":
      return `pad_end: ${args.length ?? 0}, ${liquidLiteral(args.text || " ")}`;
    case "encodeURIComponent":
      return "url_encode";
    case "decodeURIComponent":
      return "url_decode";
    default:
      return name;
  }
};

export const transKey = (key: string) => {
  if (includes(["length.min", "extensionCount.min", "count.min"], key)) {
    return "min";
  }
  if (includes(["length.max", "extensionCount.max", "count.max"], key)) {
    return "max";
  }
  return key;
};
