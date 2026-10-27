/** Infer a JSON Schema from a JSON value for body generation. */
export function toJsonSchema(value: unknown): Record<string, any> {
  if (value === null) {
    return { type: "null" };
  }
  if (Array.isArray(value)) {
    return { type: "array", items: value.length ? toJsonSchema(value[0]) : {} };
  }
  if (typeof value === "object") {
    return {
      type: "object",
      properties: Object.fromEntries(
        Object.entries(value).map(([key, child]) => [key, toJsonSchema(child)]),
      ),
    };
  }
  if (typeof value === "number") {
    return { type: Number.isInteger(value) ? "integer" : "number" };
  }
  if (typeof value === "string") {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return { type: "string", format: "email" };
    }
    if (/^https?:\/\//.test(value)) {
      return { type: "string", format: "uri" };
    }
  }
  return { type: typeof value };
}
