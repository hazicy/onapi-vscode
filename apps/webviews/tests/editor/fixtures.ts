import { test as base } from "@playwright/test";
import { createRequire } from "node:module";
import { EditorPage } from "./pages/EditorPage";

const { format } = createRequire(
  new URL("../../../extension/package.json", import.meta.url),
)("prettier");

type Pages = {
  editorPage: EditorPage;
};

export const test = base.extend<Pages>({
  editorPage: async ({ page }, use) => {
    await page.exposeFunction(
      "formatFixture",
      async (message: {
        requestId: string;
        data: { source: string; language: string };
      }) => {
        const parsers: Record<string, string> = {
          json: "jsonc",
          json5: "json5",
          javascript: "babel",
          typescript: "typescript",
          html: "html",
          css: "css",
          graphql: "graphql",
          yaml: "yaml",
        };
        const { source, language } = message.data;
        let value = source;
        try {
          value = await format(source, {
            parser: parsers[language],
            embeddedLanguageFormatting: "off",
          });
        } catch {
          // Invalid input stays intact, matching the extension worker.
        }
        return {
          action: "documentFormatted",
          requestId: message.requestId,
          data: { value },
        };
      },
    );
    await page.addInitScript(() => {
      Object.assign(window, {
        vscode: {
          postMessage: async (message: { action: string }) => {
            if (message.action !== "formatDocument") {
              return;
            }
            const result = await (window as any).formatFixture(message);
            window.dispatchEvent(new MessageEvent("message", { data: result }));
          },
        },
      });
    });
    await use(new EditorPage(page));
  },
});
