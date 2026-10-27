import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(
  new URL("../../packages/http-model/package.json", import.meta.url),
);

const modern = path.dirname(require.resolve("@faker-js/faker"));
const languages = {
  en: "fakerEN",
  zh_CN: "fakerZH_CN",
};

// Bundle only English and Simplified Chinese; other languages fall back to English.
function modernSource() {
  return (
    Object.entries(languages)
      .map(
        ([locale, name]) =>
          `import { faker as ${name} } from ${JSON.stringify(path.join(modern, "locale", locale + ".js"))}; export { ${name} };`,
      )
      .join("\n") + "\nexport { fakerEN as faker };"
  );
}

function replacement(filename) {
  const normalized = filename.split("?")[0];
  if (
    [path.join(modern, "index.js"), path.join(modern, "index.cjs")].includes(
      normalized,
    )
  )
    return modernSource();
}

export function fakerLocalesEsbuild() {
  return {
    name: "faker-used-locales",
    setup(build) {
      build.onLoad(
        {
          filter:
            /[\\/]@faker-js[\\/]faker[\\/]dist[\\/](?:cjs[\\/]|esm[\\/])?index\.(?:c?js|mjs)$/,
        },
        (args) => {
          const contents = replacement(args.path);
          return contents === undefined
            ? undefined
            : { contents, loader: "js", resolveDir: path.dirname(args.path) };
        },
      );
    },
  };
}

/** @returns {import("vite").Plugin} */
function fakerLocalesViteTransform() {
  return {
    name: "faker-used-locales",
    enforce: "pre",
    transform(source, id) {
      const code = replacement(id);
      return code === undefined ? undefined : { code, map: null };
    },
  };
}

/** @returns {import("vite").Plugin} */
export function fakerLocalesVite() {
  return {
    ...fakerLocalesViteTransform(),
    config() {
      return {
        optimizeDeps: {
          rolldownOptions: { plugins: [fakerLocalesViteTransform()] },
        },
      };
    },
  };
}
