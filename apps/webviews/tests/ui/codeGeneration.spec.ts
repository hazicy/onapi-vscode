import { expect } from "@playwright/test";
import { test } from "./fixtures";

for (const kind of ["api", "graphql"]) {
  test(`${kind} code generation loads without adding an inline panel`, async ({
    page,
    requestPage,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let started!: () => void;
    const loading = new Promise<void>((resolve) => {
      started = resolve;
    });
    await page.route(
      /\/GenerateCodeModal[^/]*\.js(?:\?.*)?$/,
      async (route) => {
        started();
        await gate;
        await route.continue();
      },
    );

    try {
      const errors = await requestPage.open(kind, {
        method: "POST",
        url: "https://example.com/request",
        header: [],
        ...(kind === "graphql"
          ? { body: { mode: "graphql", graphql: { query: "{ hello }" } } }
          : {}),
      });
      await expect(
        page.getByRole("status", { name: "Loading", exact: true }),
      ).toHaveCount(0);
      const main = page.locator("main").first();
      const before = await main.boundingBox();
      await requestPage.codeButton.click();
      await loading;
      await page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          }),
      );

      await expect(
        page.getByRole("status", { name: "Loading", exact: true }),
      ).toHaveCount(0);
      expect(await main.boundingBox()).toEqual(before);
      release();
      const modal = page.getByRole("dialog");
      await expect(modal).toBeVisible();
      const bounds = await modal.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x + bounds!.width / 2).toBeCloseTo(960, 0);
      expect(bounds!.y + bounds!.height / 2).toBeCloseTo(540, 0);
      await expect(
        modal.getByRole("button", { name: "Copy Code", exact: true }),
      ).toBeDisabled();
      expect(await main.boundingBox()).toEqual(before);
      await modal.getByRole("button", { name: "Close", exact: true }).click();
      await expect(modal).toBeHidden();
      expect(errors).toEqual([]);
    } finally {
      release();
    }
  });
}

test("code modal switches language and library, copies the latest result, and closes with Escape", async ({
  page,
  requestPage,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          (window as any).copiedCode = text;
        },
      },
    });
  });
  await requestPage.open("api", {
    method: "GET",
    url: "https://example.com/request",
    header: [],
  });
  await requestPage.codeButton.click();
  const modal = page.getByRole("dialog");
  const copy = modal.getByRole("button", { name: "Copy Code", exact: true });
  const language = modal.getByLabel("Language", { exact: true });
  const library = modal.getByLabel("Library", { exact: true });
  const editor = modal.getByRole("textbox", { name: "Code editor" });

  const request = () =>
    page.evaluate(() =>
      (window as any).messages.findLast(
        (message: any) => message.action === "generateCode",
      ),
    );
  const reply = async (
    command: any,
    code: string,
    language: string,
    variant: string,
  ) => {
    await page.evaluate(
      ({ command, code, language, variant }) => {
        window.postMessage(
          {
            action: "generatedCode",
            requestId: command.requestId,
            data: {
              requestId: command.requestId,
              code,
              language,
              variant,
              syntax: "javascript",
              languages: [
                {
                  key: "curl",
                  label: "cURL",
                  syntax_mode: "shell",
                  variants: [{ key: "cURL" }],
                },
                {
                  key: "javascript",
                  label: "JavaScript",
                  syntax_mode: "javascript",
                  variants: [{ key: "Fetch" }, { key: "XHR" }],
                },
              ],
            },
          },
          "*",
        );
      },
      { command, code, language, variant },
    );
  };

  await expect.poll(request).toBeTruthy();
  await expect(copy).toBeDisabled();
  await reply(await request(), "initial code", "curl", "cURL");
  await expect(editor).toHaveText("initial code");
  await expect(copy).toBeEnabled();

  await language.click();
  await page.getByRole("option", { name: "JavaScript", exact: true }).click();
  await expect(language).toContainText("JavaScript");
  await expect(library).toContainText("Fetch");
  await expect(copy).toBeDisabled();
  await expect
    .poll(async () => (await request())?.data.language)
    .toBe("javascript");
  const previous = await request();

  // Language controls stay usable while the preview is generating.
  await library.click();
  await page.getByRole("option", { name: "XHR", exact: true }).click();
  await expect(library).toContainText("XHR");
  await expect.poll(async () => (await request())?.data.variant).toBe("XHR");
  await reply(await request(), "latest code", "javascript", "XHR");
  await expect(editor).toHaveText("latest code");
  await reply(previous, "stale code", "javascript", "Fetch");
  await expect(editor).toHaveText("latest code");
  await copy.click();
  await expect
    .poll(() => page.evaluate(() => (window as any).copiedCode))
    .toBe("latest code");

  await page.keyboard.press("Escape");
  await expect(modal).toBeHidden();
  await expect(requestPage.codeButton).toBeFocused();
  await requestPage.codeButton.click();
  await expect
    .poll(async () => (await request())?.data)
    .toMatchObject({ language: "javascript", variant: "XHR" });
  await expect(copy).toBeDisabled();
});
