import { fakerLocalesVite } from "../../scripts/build/faker-locales.mjs";
import { generateScopedName } from "./build/css-modules.mjs";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// Injected imports also occur in shared packages, which do not own this plugin.
// Resolve the ESM shims so injected default imports receive the polyfill itself.
const polyfillAliases = Object.fromEntries(
  ["buffer", "global", "process"].map((name) => {
    const id = `vite-plugin-node-polyfills/shims/${name}`;
    return [id, fileURLToPath(import.meta.resolve(id))];
  }),
);

const panels = [
  "tagPanel",
  "environmentPanel",
  "importDataPanel",
  "folderTestPanel",
  "folderTestReportPanel",
  "shareListPanel",
  "exportDataPanel",
];

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(
    mode,
    fileURLToPath(new URL("../../", import.meta.url)),
    "ONAPI_",
  );
  const language = env.ONAPI_LANGUAGE || "auto";
  if (!["auto", "en", "zh-cn"].includes(language)) {
    throw new Error("ONAPI_LANGUAGE must be auto, en, or zh-cn.");
  }
  return {
    // Builds must not invalidate optimized dependencies used by the running dev server.
    cacheDir: `node_modules/.vite-webviews-${command}`,
    css: {
      modules: { generateScopedName },
    },
    base: "./",
    clearScreen: false,
    resolve: {
      alias: {
        ...polyfillAliases,
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    define: { __ONAPI_LANGUAGE__: JSON.stringify(language) },
    plugins: [
      {
        name: "onapi-debug-ready",
        configureServer(server) {
          server.middlewares.use(
            "/__onapi_debug_ready",
            (_request, response) => {
              response.setHeader("Content-Type", "application/json");
              response.end(
                JSON.stringify({
                  root: server.config.root,
                  session: process.env.ONAPI_DEV_SESSION,
                }),
              );
            },
          );
        },
      },
      fakerLocalesVite(),
      react(),
      svgr({ include: /\.svg(?:\?react)?$/ }),
      nodePolyfills(),
    ],
    server: { port: 8080, strictPort: true, cors: true },
    build: {
      outDir: "dist",
      // Full builds run before the extension build; watchers preserve extension.js.
      emptyOutDir: !process.argv.includes("--watch"),
      target: "es2020",
      // Keep emitted CSS compatible with the configured webview browser target.
      cssTarget: "chrome102",
      // Lower CSS in development builds as well as production.
      cssMinify: "lightningcss",
      sourcemap: mode !== "production",
      minify: mode === "production",
      cssCodeSplit: false,
      rolldownOptions: {
        // These conditional imports are only executed by the parser's Node HTTP resolver.
        external: [/^node:(?:dns|stream)\/promises$/],
        input: Object.fromEntries(
          panels.map((name) => [
            name,
            `src/app/webviews/${name[0].toUpperCase()}${name.slice(1)}.tsx`,
          ]),
        ),
        output: {
          minify:
            mode === "production"
              ? { compress: { dropConsole: true, dropDebugger: true } }
              : false,
          entryFileNames: "[name].js",
          chunkFileNames: "chunks/[name]-[hash].js",
          assetFileNames: (asset) =>
            asset.names?.some((name) => name.endsWith(".css"))
              ? "webviews.css"
              : "assets/[name]-[hash][extname]",
        },
      },
    },
  };
});
