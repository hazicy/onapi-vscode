import { test as base } from "@playwright/test";
import { format } from "oxfmt";
import { EditorPage } from "./pages/EditorPage";

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
        const extensions: Record<string, string> = {
          json: "jsonc",
          json5: "json5",
          javascript: "js",
          typescript: "ts",
          html: "html",
          css: "css",
          graphql: "graphql",
          yaml: "yaml",
        };
        const { source, language } = message.data;
        const result = await format(
          `document.${extensions[language]}`,
          source,
          { embeddedLanguageFormatting: "off" },
        );
        return {
          action: "documentFormatted",
          requestId: message.requestId,
          data: { value: result.errors.length ? source : result.code },
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
