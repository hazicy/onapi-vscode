import { build } from "esbuild";
import { chmod } from "node:fs/promises";
import { buildRuntime } from "../../packages/runtime/build.mjs";
const outdir = new URL("./dist/", import.meta.url).pathname;
await buildRuntime({ outdir });
await build({
  entryPoints: [new URL("./src/main.js", import.meta.url).pathname],
  outfile: `${outdir}/onapi.js`,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  alias: {
    "@onapi/runtime/http/adapter": new URL(
      "../../packages/runtime/src/http/adapter.ts",
      import.meta.url,
    ).pathname,
  },
  banner: { js: "#!/usr/bin/env node" },
});
await chmod(`${outdir}/onapi.js`, 0o755);
