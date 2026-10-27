import fs from "node:fs";
import { createRequire } from "node:module";
const webviewRequire = createRequire(
  new URL("../../apps/webviews/package.json", import.meta.url),
);
const modelRequire = createRequire(
  new URL("../../packages/domain/package.json", import.meta.url),
);
import vm from "node:vm";
import { transform } from "esbuild";
import { pathToFileURL, fileURLToPath } from "node:url";

export async function nativeDependency(id) {
  let module;
  try {
    module = await import(id);
  } catch (error) {
    try {
      module = modelRequire(id);
    } catch {
      module = webviewRequire(id);
    }
  }
  return module.default ?? module;
}

// Execute the real ESM source with explicit mock modules at host/UI boundaries.
export default async function loadTypeScript(
  filename,
  dependencies,
  globals = {},
) {
  const source = fs.readFileSync(filename, "utf8");
  const { code: compiled } = await transform(source, {
    loader: filename.endsWith(".tsx") ? "tsx" : "ts",
    format: "esm",
    target: "es2022",
    jsx: "automatic",
    sourcefile: filename,
  });
  const context = vm.createContext({
    structuredClone,
    crypto: globalThis.crypto,
    ...globals,
  });
  const module = new vm.SourceTextModule(compiled, {
    context,
    identifier: pathToFileURL(filename).href,
    initializeImportMeta(meta) {
      meta.url = pathToFileURL(filename).href;
    },
    async importModuleDynamically(id) {
      const dependency = await linkDependency(id);
      await dependency.link(() => {});
      await dependency.evaluate();
      return dependency;
    },
  });
  async function linkDependency(id) {
    let value;
    let dependencyError;
    try {
      value = await dependencies(id);
    } catch (error) {
      dependencyError = error;
    }
    const nonempty = (candidate) =>
      candidate && Object.keys(candidate).length > 0;
    if (id.startsWith("@onapi/domain") && !nonempty(value)) {
      const subpath =
        id === "@onapi/domain" ? "index" : id.slice("@onapi/domain/".length);
      value = await loadTypeScript(
        fileURLToPath(
          new URL(`../../packages/domain/src/${subpath}.ts`, import.meta.url),
        ),
        nativeDependency,
        globals,
      );
    } else if (!nonempty(value) && id === "@onapi/contracts") {
      value = await loadTypeScript(
        fileURLToPath(
          new URL("../../packages/contracts/src/index.ts", import.meta.url),
        ),
        nativeDependency,
        globals,
      );
    } else if (!nonempty(value) && id === "postman-url-encoder/parser/index.js")
      value = await nativeDependency(id);
    if (!nonempty(value) && dependencyError) throw dependencyError;
    const names = new Set([...Object.keys(value ?? {}), "default"]);
    return new vm.SyntheticModule(
      [...names],
      function () {
        for (const name of names) {
          this.setExport(
            name,
            name === "default" ? (value?.default ?? value) : value?.[name],
          );
        }
      },
      { context },
    );
  }
  await module.link(linkDependency);
  await module.evaluate();
  return module.namespace;
}
