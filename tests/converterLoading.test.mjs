import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
const calls = [];
globalThis.__converterCalls = calls;
const result = await build({
  entryPoints: ["packages/api-converter/src/export.ts"],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  plugins: [
    {
      name: "converter-boundary",
      setup(builder) {
        builder.onResolve({ filter: /^\.\/index$/ }, () => ({
          path: "converter",
          namespace: "test",
        }));
        builder.onResolve(
          { filter: /^@onapi\/api-converter\/adapters\/converter-adapter$/ },
          () => ({
            path: "adapter",
            namespace: "test",
          }),
        );
        builder.onLoad({ filter: /.*/, namespace: "test" }, (args) => ({
          contents:
            args.path === "adapter"
              ? `export const nativeCollection = data => data; export const fromApp = data => ({ data, warnings: [] }); export const toApp = data => data; export const toSwaggerImport = data => data;`
              : `globalThis.__converterCalls.push('load'); const convert = data => { globalThis.__converterCalls.push('convert'); return { data, warnings: [] }; }; export { convert as readPostman, convert as writePostman, convert as readThunder, convert as readOpenApi, convert as writeOpenApi };`,
        }));
      },
    },
  ],
});
const api = await import(
  "data:text/javascript;base64," +
    Buffer.from(result.outputFiles[0].text).toString("base64")
);
test("converters load on demand and concurrent calls share one module load", async () => {
  try {
    assert.deepEqual(calls, []);
    const input = { requests: [] };
    const results = await Promise.all([
      api.exportMethod.apiToSwagger(input, "3.0"),
      api.exportMethod.apiToPostman(input),
      api.importMethod.thunderToApipost(input, ""),
      api.importMethod.swaggerToApipost(input, null),
    ]);
    assert.equal(calls.filter((v) => v === "load").length, 1);
    assert.equal(calls.filter((v) => v === "convert").length, 3);
    for (const result of results)
      assert.deepEqual(result, {
        status: "success",
        message: "",
        data: input,
        warnings: [],
      });
  } finally {
    delete globalThis.__converterCalls;
  }
});
