import { createRequire } from "node:module";
import { cp, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));

// Preserve Oxfmt's dynamic imports and native bindings instead of bundling them.
export async function buildFormatter(outdir) {
  const destination = path.join(outdir, "formatter");
  const copied = new Set();
  async function copyPackage(name, from, optional = false) {
    const require = createRequire(from);
    let manifestPath;
    try {
      manifestPath = require.resolve(`${name}/package.json`);
    } catch (error) {
      if (optional && error.code === "MODULE_NOT_FOUND") return;
      throw error;
    }
    if (copied.has(name)) return;
    copied.add(name);
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    await cp(
      path.dirname(manifestPath),
      path.join(destination, "node_modules", name),
      {
        recursive: true,
        dereference: true,
      },
    );
    for (const dependency of Object.keys(manifest.dependencies || {})) {
      await copyPackage(dependency, manifestPath);
    }
    for (const dependency of Object.keys(manifest.optionalDependencies || {})) {
      await copyPackage(dependency, manifestPath, true);
    }
  }
  await mkdir(destination, { recursive: true });
  await copyPackage("oxfmt", path.join(root, "apps/extension/package.json"));
  await cp(
    path.join(
      root,
      "apps/extension/src/platform/webviews/formatter-worker.mjs",
    ),
    path.join(destination, "worker.mjs"),
  );
}

export function formatterVite(outdir) {
  return { name: "onapi-formatter", closeBundle: () => buildFormatter(outdir) };
}
