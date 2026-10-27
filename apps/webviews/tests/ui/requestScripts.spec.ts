import { expect, test } from "@playwright/test";

test("script headers align and editors expand independently in both phases", async ({
  page,
}, testInfo) => {
  await page.goto("/?requestScripts");
  for (const [tab, title, source] of [
    ["Pre-request", "Pre-request script", "before"],
    ["Post-response", "Tests", "after"],
  ]) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    const panel = page.getByRole("tabpanel", { name: tab, exact: true });
    const trigger = panel.getByRole("button", {
      name: new RegExp(title + "$"),
    });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toHaveCSS("display", "flex");
    const header = trigger.locator("..");
    const box = await header.boundingBox();
    expect(box!.height).toBeLessThanOrEqual(40);
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(panel.locator(".cm-content").first()).toContainText(source);
    expect(
      (await panel.locator(".cm-editor").first().boundingBox())!.height,
    ).toBeGreaterThan(250);
    await panel.getByRole("button", { name: "Add script" }).click();
    const triggers = panel.getByRole("button", {
      name: new RegExp(title + "$"),
    });
    await expect(triggers).toHaveCount(2);
    await expect(triggers.nth(1)).toHaveAttribute("aria-expanded", "true");
    await triggers.first().click();
    await expect(triggers.first()).toHaveAttribute("aria-expanded", "false");
    await expect(triggers.nth(1)).toHaveAttribute("aria-expanded", "true");
    const content = panel.locator(".cm-content").last();
    await content.fill("console.log('added')");
    await expect(page.getByLabel("Script events")).toContainText("added");
    await panel
      .getByRole("button", { name: "Delete script", exact: true })
      .last()
      .click();
    await page.getByRole("button", { name: "OK", exact: true }).click();
    await expect(triggers).toHaveCount(1);
  }
  await page.screenshot({ path: testInfo.outputPath("scripts.png") });
});
