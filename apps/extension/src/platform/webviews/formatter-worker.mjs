import { parentPort } from "node:worker_threads";
import { format } from "oxfmt";

const extensions = {
  javascript: "js",
  typescript: "ts",
  json: "jsonc",
  json5: "json5",
  html: "html",
  css: "css",
  graphql: "graphql",
  yaml: "yaml",
};

parentPort.on("message", async ({ requestId, source, language }) => {
  let value = source;
  const extension = Object.hasOwn(extensions, language) && extensions[language];
  if (extension && Buffer.byteLength(source) <= 5 * 1024 * 1024) {
    try {
      const result = await format(`document.${extension}`, source, {
        embeddedLanguageFormatting: "off",
      });
      if (!result.errors.length) {
        value = result.code;
      }
    } catch {
      // Unsupported or invalid input stays intact.
    }
  }
  parentPort.postMessage({ requestId, value });
});
