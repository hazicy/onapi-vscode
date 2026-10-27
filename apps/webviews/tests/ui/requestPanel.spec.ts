import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?requestPanel");
});

test("request navigation and send action adapt to panel width", async ({
  page,
}) => {
  const workspace = page.getByRole("region", { name: "Request workspace" });
  const send = workspace.getByRole("button", { name: "Send", exact: true });
  await expect(send.locator("span")).toBeVisible();
  await page.getByRole("button", { name: "Narrow panel" }).click();
  await expect(send.locator("span")).toBeHidden();
  const more = workspace.getByRole("button", {
    name: "More actions",
    exact: true,
  });
  await more.click();
  await expect(
    page.getByRole("menuitem", { name: "Code", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  const tabs = workspace.getByRole("tablist").first();
  await expect(tabs).toHaveCSS("overflow-x", "hidden");
  const tabMenu = tabs
    .locator("..")
    .getByRole("button", { name: "More tabs", exact: true });
  await tabMenu.click();
  await page
    .getByRole("menuitem", { name: "Post-response", exact: true })
    .click();
  const post = workspace.getByRole("tab", {
    name: "Post-response",
    exact: true,
  });
  await expect(post).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "Wide panel" }).click();
  await expect(send.locator("span")).toBeVisible();
  await expect(
    workspace.getByRole("tab", { name: "Headers", exact: true }).first(),
  ).toBeVisible();
  await expect(post).toHaveAttribute("aria-selected", "true");
  await expect(tabMenu).toBeHidden();
});

test("parameter rows use compact sizing and follow host font size", async ({
  page,
}) => {
  const workspace = page.getByRole("region", { name: "Request workspace" });
  const params = workspace.getByRole("tabpanel", { name: /Params/ });
  const input = params.getByRole("textbox").first();
  await expect(input).toBeVisible();
  const fontSize = await input.evaluate((node) => {
    document.documentElement.style.setProperty("--vscode-font-size", "17px");
    return getComputedStyle(node).fontSize;
  });
  expect(fontSize).toBe("17px");
  await expect(
    params.locator("[class*='_key_'] > div > div").first(),
  ).toHaveCSS("height", "32px");
  const controls = params.getByRole("textbox");
  const keyBox = await controls.nth(0).boundingBox();
  const valueBox = await controls.nth(1).boundingBox();
  expect(keyBox).not.toBeNull();
  expect(valueBox).not.toBeNull();
  expect(valueBox!.height).toBe(keyBox!.height);
  expect(valueBox!.y).toBe(keyBox!.y);
  const keyFrame = params.locator("[class*='_key_'] > div > div").first();
  const valueFrame = params.locator("[class*='_value_']").first();
  expect((await valueFrame.boundingBox())!.height).toBe(
    (await keyFrame.boundingBox())!.height,
  );
  await controls.nth(1).focus();
  expect((await controls.nth(1).boundingBox())!.height).toBe(keyBox!.height);
});

test("response tools keep encoding in a popover and wrap without overflowing", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Narrow panel" }).click();
  const response = page.getByRole("region", { name: "Response tools" });
  await response
    .getByRole("button", { name: "Response encoding", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Response encoding", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  const wrap = response.getByRole("button", { name: "Toggle word wrap" });
  await wrap.click();
  await expect(wrap).toHaveAttribute("aria-pressed", "false");
  expect(
    await response.evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
});

test("empty, sending and failed requests have distinct states", async ({
  page,
}) => {
  const workspace = page.getByRole("region", { name: "Request workspace" });
  await expect(
    workspace.getByRole("status").filter({ hasText: "Send a request" }),
  ).toContainText("Send a request");
  await expect(workspace.locator("kbd").last()).toHaveText("Enter");
  await workspace.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    workspace.getByRole("button", { name: "Send", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Fail request" }).click();
  await expect(workspace.getByRole("alert")).toContainText("Request failed");
  await expect(workspace.getByRole("alert")).toContainText("ECONNREFUSED");
});

test("request panel screenshots at wide and narrow widths", async ({
  page,
}, testInfo) => {
  await page.evaluate(() => {
    const vars = {
      "--vscode-editor-background": "#1e1e1e",
      "--color-bg-right": "#1e1e1e",
      "--vscode-foreground": "#cccccc",
      "--font-content-color": "#cccccc",
      "--font-light-color": "#999999",
      "--vscode-descriptionForeground": "#999999",
      "--color-border": "#454545",
      "--vscode-widget-border": "#454545",
      "--vscode-input-background": "#313131",
      "--vscode-input-foreground": "#cccccc",
      "--vscode-button-background": "#0078d4",
      "--vscode-button-foreground": "#ffffff",
      "--vscode-toolbar-hoverBackground": "#ffffff16",
      "--vscode-list-hoverBackground": "#ffffff0a",
    };
    for (const [key, value] of Object.entries(vars))
      document.documentElement.style.setProperty(key, value);
    document.body.style.background = "#1e1e1e";
    document.body.style.color = "#cccccc";
  });
  const workspace = page.getByRole("region", { name: "Request workspace" });
  await expect(workspace.getByRole("tab", { name: /Params/ })).toBeVisible();
  expect(
    await workspace.evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  await workspace.screenshot({ path: testInfo.outputPath("request-wide.png") });
  await page.getByRole("button", { name: "Narrow panel" }).click();
  expect(
    await workspace.evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  await workspace.screenshot({
    path: testInfo.outputPath("request-narrow.png"),
  });
  await page
    .getByRole("region", { name: "Response tools" })
    .screenshot({ path: testInfo.outputPath("response-narrow.png") });
});
