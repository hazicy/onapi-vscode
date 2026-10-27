import { build, context } from "esbuild";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { cp, mkdir, readFile, stat, rm } from "node:fs/promises";
import path from "node:path";
const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL(".", import.meta.url));
export async function buildRuntime({
  production = true,
  outdir = path.join(root, "dist"),
  watch = false,
} = {}) {
  if (production) {
    await rm(path.join(outdir, "postman.cjs.map"), { force: true });
  }
  const options = {
    entryPoints: [path.join(root, "src/http/postman.js")],
    outfile: path.join(outdir, "postman.cjs"),
    bundle: true,
    platform: "node",
    target: "node22",
    format: "cjs",
    minify: production,
    sourcemap: !production,
    metafile: true,
    plugins: [
      {
        name: "postman-sandbox-bootcode",
        setup(builder) {
          builder.onLoad(
            { filter: /postman-sandbox[\\/]lib[\\/]bootcode\.js$/ },
            async () => ({
              contents: await readFile(
                require.resolve("postman-sandbox/.cache/bootcode.js"),
                "utf8",
              ),
              loader: "js",
            }),
          );
        },
      },
      {
        name: "worker-source",
        setup(builder) {
          builder.onLoad({ filter: /http[\\/]postman\.js$/ }, async (args) => ({
            contents: await readFile(args.path, "utf8"),
            loader: "js",
            watchFiles: [path.join(root, "src/worker.js")],
          }));
          builder.onEnd(async () => {
            await cp(
              path.join(root, "src/worker.js"),
              path.join(outdir, "worker.js"),
            );
          });
        },
      },
    ],
  };
  const watcher = watch ? await context(options) : undefined;
  const result = watcher ? await watcher.rebuild() : await build(options);
  if (watcher) {
    await watcher.watch();
  }
  await cp(path.join(root, "src/worker.js"), path.join(outdir, "worker.js"));
  await mkdir(path.join(outdir, "licenses"), { recursive: true });
  for (const name of [
    "postman-runtime",
    "postman-sandbox",
    "postman-collection",
    "uvm",
  ]) {
    await cp(
      require.resolve(`${name}/LICENSE.md`),
      path.join(outdir, "licenses", `${name}.txt`),
    );
  }
  console.log(
    `${path.join(outdir, "postman.cjs")} ${((await stat(path.join(outdir, "postman.cjs"))).size / 1000).toFixed(2)} kB`,
  );
  return result;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await buildRuntime({
    production: !process.argv.includes("--development"),
    watch: process.argv.includes("--watch"),
  });
}
