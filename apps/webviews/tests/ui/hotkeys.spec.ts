import { expect, test } from "@playwright/test";

for (const platform of ["mac", "windows"] as const) {
  test(`${platform} request shortcuts send from URL and body editors and save`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      userAgent:
        platform === "mac"
          ? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/141.0.0.0 Safari/537.36"
          : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141.0.0.0 Safari/537.36",
    });
    await context.addInitScript(
      (value) =>
        Object.defineProperty(navigator, "platform", { get: () => value }),
      platform === "mac" ? "MacIntel" : "Win32",
    );
    const page = await context.newPage();
    const initialData = {
      apiData: {
        id: "hotkey-api",
        kind: "api",
        project_id: "-1",
        parentId: "0",
        name: "Shortcut request",
        request: {
          method: "POST",
          url: "https://example.com",
          header: [],
          auth: { type: "noauth" },
          body: {
            mode: "raw",
            raw: '{"hello":"world"}',
            options: { raw: { language: "json" } },
          },
        },
        event: [],
        response: [],
      },
      projectConfig: {},
      systemConfig: { raw_parameter_pilot_bubble_switch: false },
      vscodeTheme: "Default Dark Modern",
      docBaseUrl: "",
    };
    await page.route("**/hotkeys.html", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="/webviews.css"></head><body><div id="root"></div><script>window.messages=[];window.shortcutDispatches=[];document.addEventListener('keydown',event=>{if(!event.repeat&&((event.key==='Enter'&&(event.metaKey||event.ctrlKey))||(event.key.toLowerCase()==='s'&&(event.metaKey||event.ctrlKey||event.altKey))))window.shortcutDispatches.push({send:window.messages.filter(message=>message.action==='sendApi').length,save:window.messages.filter(message=>message.action==='saveApiData').length})});window.vscode={postMessage(message){window.messages.push(message)}};window.vscodeData=${JSON.stringify({ kind: "api", initialData })};window.resourceBaseUrl=location.origin;</script><script type="module" src="/tagPanel.js"></script></body></html>`,
      }),
    );
    try {
      await page.goto("http://127.0.0.1:4180/hotkeys.html");
      const modifier = platform === "mac" ? "Meta" : "Control";
      const sent = () =>
        page.evaluate(() =>
          (window as any).messages.filter(
            (message: any) => message.action === "sendApi",
          ),
        );
      const url = page.getByRole("textbox", {
        name: "Enter URL or paste cURL text",
      });
      await url.click();
      await page.keyboard.press(`${modifier}+Enter`);
      await expect.poll(sent).toHaveLength(1);
      await page
        .getByRole("tab")
        .filter({ hasText: /^(?:Body|JSON|Raw)$/ })
        .click();
      const editor = page
        .getByRole("textbox", { name: "Code editor" })
        .and(page.locator('[contenteditable="true"]'));
      await editor.fill('{"updated":true}');
      const content = await editor.innerText();
      await page.keyboard.down(modifier);
      await page.keyboard.down("Enter");
      await page.keyboard.down("Enter"); // Auto-repeat must not send twice.
      await page.keyboard.up("Enter");
      await page.keyboard.up(modifier);
      await expect.poll(sent).toHaveLength(2);
      expect((await sent())[1].data.request.body.raw).toBe(content);
      await expect(editor).toHaveText(content);
      await page.keyboard.press("Alt+s");
      await expect.poll(sent).toHaveLength(3);
      await page.keyboard.press(`${modifier}+s`);
      await expect
        .poll(() =>
          page.evaluate(() =>
            (window as any).messages.filter(
              (message: any) => message.action === "saveApiData",
            ),
          ),
        )
        .toHaveLength(1);
      // Observe each message in the original keydown dispatch, avoiding flaky
      // timing thresholds while rejecting debounce/timer-based delays.
      expect(
        await page.evaluate(() => (window as any).shortcutDispatches),
      ).toEqual([
        { send: 1, save: 0 },
        { send: 2, save: 0 },
        { send: 3, save: 0 },
        { send: 3, save: 1 },
      ]);
    } finally {
      await context.close();
    }
  });
}
