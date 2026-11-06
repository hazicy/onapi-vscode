import { expect, test } from "@playwright/test";

for (const protocol of ["websocket", "socketio"]) {
  test(`${protocol}: find keys reach the native Webview host`, async ({
    page,
  }) => {
    await page.goto(`/?socketWorkspace=${protocol}`);
    await page.evaluate(() => {
      (window as any).hostFindKeys = [];
      window.addEventListener("keydown", (event) => {
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === "f"
        ) {
          (window as any).hostFindKeys.push(event.defaultPrevented);
        }
      });
    });
    const workspace = page.getByRole("region", {
      name: "Socket workspace",
      exact: true,
    });
    await workspace
      .getByRole("button", { name: "Connect", exact: true })
      .focus();
    await page.keyboard.press("Meta+f");
    await page.keyboard.press("Control+f");
    await workspace
      .locator(".cm-content[contenteditable=true]")
      .first()
      .click();
    await page.keyboard.press("Meta+f");
    await page.keyboard.press("Control+f");
    await expect(
      workspace.getByRole("textbox", { name: "Search", exact: true }),
    ).toHaveCount(0);
    await expect(workspace.locator(".cm-search")).toHaveCount(0);
    expect(await page.evaluate(() => (window as any).hostFindKeys)).toEqual([
      false,
      false,
      false,
      false,
    ]);
  });
}
