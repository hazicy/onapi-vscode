import { generateScopedName } from "../../build/css-modules.mjs";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  css: {
    modules: { generateScopedName },
  },
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react(), svgr({ include: /\.svg(?:\?react)?$/ })],
  resolve: {
    alias: { "@": fileURLToPath(new URL("../../src", import.meta.url)) },
  },
  define: { __ONAPI_LANGUAGE__: JSON.stringify("en") },
  server: { host: "127.0.0.1", port: 4179, strictPort: true },
});
