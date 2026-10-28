import { parentPort } from "node:worker_threads";
import { format } from "prettier";

const parsers = {
  javascript: "babel",
  typescript: "typescript",
  json: "jsonc",
  json5: "json5",
  html: "html",
  css: "css",
  graphql: "graphql",
  yaml: "yaml",
};

parentPort.on("message", async ({ requestId, source, language }) => {
  let value = source;
  const parser = Object.hasOwn(parsers, language) && parsers[language];
  if (parser && Buffer.byteLength(source) <= 5 * 1024 * 1024) {
    try {
      value = await format(source, {
        parser,
        embeddedLanguageFormatting: "off",
      });
    } catch {
      // Unsupported or invalid input stays intact.
    }
  }
  parentPort.postMessage({ requestId, value });
});
