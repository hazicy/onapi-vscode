import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";

// Analyze emitted files without rebuilding/minifying them: count their actual
// on-disk bytes, following static imports and deduplicating shared chunks.
const { metafile } = await build({
  entryPoints: ["dist/tagPanel.js"],
  bundle: true,
  splitting: true,
  format: "esm",
  outdir: "measurement",
  write: false,
  metafile: true,
  logLevel: "silent",
  external: ["*.css"],
  plugins: [
    {
      name: "ignore-unresolved-vendor-requires",
      setup(builder) {
        builder.onResolve({ filter: /^\./ }, (args) => {
          if (
            args.kind === "require-call" &&
            !fs.existsSync(path.resolve(args.resolveDir, args.path))
          ) {
            return { path: args.path, external: true };
          }
        });
      },
    },
  ],
});
const inputs = metafile.inputs;
function closure(roots) {
  const seen = new Set();
  function visit(file) {
    if (seen.has(file) || !inputs[file]) return;
    seen.add(file);
    for (const dependency of inputs[file].imports) {
      if (dependency.kind !== "dynamic-import" && !dependency.external)
        visit(dependency.path);
    }
  }
  roots.forEach(visit);
  return seen;
}
function summarize(files) {
  const rows = [...files].map((file) => ({
    file,
    bytes: fs.statSync(file).size,
  }));
  return {
    files: rows.length,
    bytes: rows.reduce((sum, row) => sum + row.bytes, 0),
    largest: rows.sort((a, b) => b.bytes - a.bytes).slice(0, 8),
  };
}
// Content declares HTTP first, followed by SSE, folder, WS, Socket.IO, GraphQL.
const protocols = inputs["dist/tagPanel.js"].imports.filter(
  (item) => item.kind === "dynamic-import",
);
if (protocols.length !== 6)
  throw new Error(`Expected six protocol imports, got ${protocols.length}`);
const entry = closure(["dist/tagPanel.js"]);
const http = closure(["dist/tagPanel.js", protocols[0].path]);
console.log(
  JSON.stringify(
    {
      entry: summarize(entry),
      httpProtocol: summarize(http),
      additionalHttpBytes: summarize(
        new Set([...http].filter((file) => !entry.has(file))),
      ).bytes,
      cssBytes: fs.statSync("dist/webviews.css").size,
      note: "Uncompressed JS; excludes nested lazy tabs, CSS, Webview creation and runtime rendering.",
    },
    null,
    2,
  ),
);
