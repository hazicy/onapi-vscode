import JSON5 from "json5";

/** Generate a body from its existing shape using the shared Schema generator. */
export async function generateMockBody(input: unknown): Promise<string> {
  if (typeof input !== "string") {
    return JSON5.stringify(input, null, "\t");
  }
  try {
    const value = JSON5.parse(input);
    const [{ toJsonSchema }, { default: MockSchema }] = await Promise.all([
      import("@onapi/http-model/mock/infer-schema"),
      import("@onapi/http-model/mock/schema"),
    ]);
    const schema = toJsonSchema(value);
    const data = await new (MockSchema as any)({ lang: "en" }).mock(schema);
    return JSON.stringify(data, null, "\t");
  } catch {
    // Keep the editor contents intact when parsing or generation fails.
    return input;
  }
}
