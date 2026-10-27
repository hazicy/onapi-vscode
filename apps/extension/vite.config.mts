import { fileURLToPath } from "node:url";
import { builtinModules } from "node:module";
import { defineConfig, loadEnv } from "vite";
import { fakerLocalesVite } from "../../tooling/build/faker-locales.mjs";

const builtins = new Set(
  builtinModules.flatMap((name) => [name, `node:${name}`]),
);
export default defineConfig(({ mode }) => {
  const env = loadEnv(
    mode,
    fileURLToPath(new URL("../../", import.meta.url)),
    "ONAPI_",
  );
  return {
    publicDir: false,
    define: {
      __ONAPI_LANGUAGE__: JSON.stringify(env.ONAPI_LANGUAGE || "auto"),
      "process.env.NODE_ENV": JSON.stringify(mode),
      "process.env.ONAPI_DEV_SERVER": JSON.stringify(
        process.env.ONAPI_DEV_SERVER || env.ONAPI_DEV_SERVER || "false",
      ),
    },
    plugins: [fakerLocalesVite()],
    build: {
      ssr: true,
      target: "node22",
      outDir: ".build",
      emptyOutDir: true,
      sourcemap: mode !== "production",
      minify: mode === "production",
      rolldownOptions: {
        input: { extension: "src/extension.ts" },
        external: (id) => id === "vscode" || builtins.has(id),
        output: {
          minify:
            mode === "production"
              ? { compress: { dropConsole: true, dropDebugger: true } }
              : false,
          format: "es",
          entryFileNames: "extension.js",
          chunkFileNames: "extension-[name]-[hash].js",
        },
      },
    },
    ssr: { noExternal: true, resolve: { mainFields: ["module", "main"] } },
  };
});
