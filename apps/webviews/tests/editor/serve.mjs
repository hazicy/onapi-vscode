import { fileURLToPath } from "node:url";
import esbuild from "esbuild";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

async function main() {
  const temporary = await fs.mkdtemp(
    path.join(os.tmpdir(), "onapi-editor-test-"),
  );
  const root = path.resolve(
    fileURLToPath(new URL(".", import.meta.url)),
    "../../../..",
  );
  await fs.writeFile(
    path.join(temporary, "index.html"),
    '<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/fixture.css"><style>body{--color-bg-right:#fff;--color-border:#ddd} .code-diff-host{width:900px}</style></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>',
  );
  const context = await esbuild.context({
    absWorkingDir: root,
    entryPoints: ["apps/webviews/tests/editor/fixture.tsx"],
    outdir: temporary,
    bundle: true,
    splitting: true,
    format: "esm",
    platform: "browser",
    jsx: "automatic",
    alias: {
      "@": path.join(root, "apps/webviews/src"),
      "@/app/store": path.join(
        fileURLToPath(new URL(".", import.meta.url)),
        "store.ts",
      ),
      "@/shared/utils/global": path.join(
        fileURLToPath(new URL(".", import.meta.url)),
        "global.ts",
      ),
    },
    define: { "process.env.NODE_ENV": '"development"' },
  });
  await context.serve({ servedir: temporary, host: "127.0.0.1", port: 4178 });
  const stop = async () => {
    await context.dispose();
    await fs.rm(temporary, { recursive: true, force: true });
    process.exit(0);
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
