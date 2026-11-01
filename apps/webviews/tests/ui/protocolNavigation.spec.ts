import { expect, test } from "@playwright/test";

for (const [protocol, query] of [
  ["HTTP", "requestPanel"],
  ["GraphQL", "requestPanel&graphql"],
  ["WebSocket", "socketWorkspace=websocket"],
  ["Socket.IO", "socketWorkspace=socketio"],
  ["AI", "aiMcp=ai"],
  ["MCP", "aiMcp=mcp"],
  ["gRPC", "grpc"],
]) {
  test(`${protocol} uses shared navigation, host font and execution controls`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/?${query}`);
    // The legacy font token intentionally differs, so it cannot silently override host sizing.
    await page.addStyleTag({
      content: `:root { --vscode-font-size: 15px; --vscode-font-family: Arial; --font-size-14: 23px; --vscode-focusBorder: rgb(0, 127, 212); }`,
    });
    const tablist = page.getByRole("tablist").first();
    const first = tablist.getByRole("tab").first();
    await expect(first).toBeVisible();
    await expect(first).toHaveCSS("font-size", "15px");
    await expect(first).toHaveCSS("height", "36px");
    await expect(first).toHaveCSS("border-radius", "0px");
    await first.click();
    await expect(first).toHaveAttribute("aria-selected", "true");
    await expect(first).toHaveCSS("border-bottom-color", "rgb(0, 127, 212)");
    const second = tablist.getByRole("tab").nth(1);
    await first.press("ArrowRight");
    await expect(second).toBeFocused();
    await second.press("Enter");
    await expect(second).toHaveAttribute("aria-selected", "true");
    const panelId = await second.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    await expect(page.locator(`[id="${panelId}"]`)).toBeVisible();
    const action = page.locator("[data-request-action]").first();
    await expect(action).toBeVisible();
    await expect(action).toHaveCSS("height", "28px");
    await expect(action).toHaveCSS("font-size", "15px");
  });
}
