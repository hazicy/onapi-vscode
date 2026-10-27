import { test as base } from "@playwright/test";
import { EditorPage } from "./pages/EditorPage";

type Pages = {
  editorPage: EditorPage;
};

export const test = base.extend<Pages>({
  editorPage: async ({ page }, use) => {
    await use(new EditorPage(page));
  },
});
