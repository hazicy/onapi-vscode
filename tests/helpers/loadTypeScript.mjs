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
import { parseSync } from "oxc-parser";
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
  });
  const { program } = parseSync(filename + ".js", compiled);
  const requested = new Map();
  for (const statement of program.body) {
    if (statement.type !== "ImportDeclaration") continue;
    const id = statement.source.value;
    const names = requested.get(id) ?? new Set(["default"]);
    for (const specifier of statement.specifiers) {
      if (specifier.type === "ImportSpecifier") {
        names.add(specifier.imported.name ?? specifier.imported.value);
      }
    }
    requested.set(id, names);
  }
  await module.link(async (id) => {
    let value;
    let dependencyError;
    try {
      value = await dependencies(id);
    } catch (error) {
      dependencyError = error;
    }
    const nonempty = (candidate) =>
      candidate && Object.keys(candidate).length > 0;
    let alias;
    if (id.startsWith("@onapi/domain/"))
      alias = "@/" + id.slice("@onapi/domain/".length).replace(/\/index$/, "");
    else if (id.startsWith(".")) {
      const resolved = fileURLToPath(new URL(id, module.identifier));
      const marker = "/apps/webviews/src/";
      if (resolved.includes(marker))
        alias = "@/" + resolved.split(marker)[1].replace(/\/index$/, "");
    }
    if (!nonempty(value) && alias) {
      try {
        value = await dependencies(alias);
        dependencyError = undefined;
      } catch (error) {
        dependencyError = error;
      }
    }
    if (
      id.startsWith("@onapi/domain") &&
      (!nonempty(value) ||
        [...(requested.get(id) || [])]
          .filter((name) => name !== "default")
          .some((name) => !(name in Object(value))))
    ) {
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
    const names = new Set([
      ...Object.keys(value ?? {}),
      ...(requested.get(id) ?? []),
      "default",
    ]);
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
  });
  await module.evaluate();
  return module.namespace;
}
