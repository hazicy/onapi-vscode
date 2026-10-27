import fs from "node:fs";
import { createRequire } from "node:module";
const webviewRequire = createRequire(
  new URL("../../apps/webviews/package.json", import.meta.url),
);
const contractsRequire = createRequire(
  new URL("../../packages/contracts/package.json", import.meta.url),
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
    module = id === "zod" ? contractsRequire(id) : await import(id);
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
    } else if (
      !nonempty(value) &&
      (id === "@onapi/contracts" || id.startsWith("@onapi/contracts/"))
    ) {
      const manifestUrl = new URL(
        "../../packages/contracts/package.json",
        import.meta.url,
      );
      const manifest = JSON.parse(fs.readFileSync(manifestUrl, "utf8"));
      const subpath =
        id === "@onapi/contracts"
          ? "."
          : `.${id.slice("@onapi/contracts".length)}`;
      const entry = manifest.exports[subpath];
      if (typeof entry !== "string")
        throw new Error(`Unknown contracts export: ${id}`);
      value = await loadTypeScript(
        fileURLToPath(new URL(entry, manifestUrl)),
        nativeDependency,
        globals,
      );
    } else if (
      !nonempty(value) &&
      id.startsWith(".") &&
      dependencies === nativeDependency
    ) {
      // Resolve real relative modules only for native loading. Explicit mocks
      // still fail when they omit or reject a dependency.
      const target = fileURLToPath(new URL(id, pathToFileURL(filename)));
      const entry = [target, `${target}.ts`, `${target}/index.ts`].find(
        (candidate) =>
          fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
      );
      if (entry) value = await loadTypeScript(entry, nativeDependency, globals);
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
