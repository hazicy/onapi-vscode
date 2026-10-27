import { expect } from "@playwright/test";
import { test } from "./fixtures";

test("custom defaults block Escape and mask dismissal, preserve state, and restore focus", async ({
  page,
  drawerPage,
}) => {
  await drawerPage.open();
  const trigger = drawerPage.openDrawerButton;
  await trigger.click();
  const drawer = drawerPage.testDrawerDialog;
  await expect(drawer).toBeVisible();
  await expect(drawer).toHaveCSS("width", "1000px");
  await drawerPage.draft.fill("retained");
  await page.keyboard.press("Escape");
  await expect(drawer).toBeVisible();
  await page.mouse.click(10, 100);
  await expect(drawer).toBeVisible();
  await expect(drawerPage.closeCountIncludingHidden).toHaveText("0");
  await drawer.getByRole("button", { name: "Close", exact: true }).click();
  await expect(drawer).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(drawerPage.transitionCompleteStatus).toHaveText("false");
  await trigger.click();
  await expect(drawerPage.draft).toHaveValue("retained");
});

test("allows opted-in Escape and mask dismissal with a single callback", async ({
  page,
  drawerPage,
}) => {
  await drawerPage.open("&dismissible&width=600");
  const trigger = drawerPage.openDrawerButton;
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(drawerPage.testDrawerDialog).toBeHidden();
  await expect(drawerPage.closeCount).toHaveText("1");
  await trigger.click();
  await expect(drawerPage.testDrawerDialog).toBeVisible();
  await page.mouse.click(10, 100);
  await expect(drawerPage.testDrawerDialog).toBeHidden();
  await expect(drawerPage.closeCount).toHaveText("2");
});

test("destroyOnClose resets children and accepts body styles, extra and footer", async ({
  drawerPage,
}) => {
  await drawerPage.open("&destroy");
  const trigger = drawerPage.openDrawerButton;
  await trigger.click();
  const draft = drawerPage.draft;
  await expect(draft.locator("..").locator("..")).toHaveCSS("padding", "0px");
  await draft.fill("temporary");
  await drawerPage.copyCodeButton.click();
  await expect(drawerPage.selectedOptionStatus).toHaveText("copied");
  await drawerPage.doneButton.click();
  await expect(draft).toHaveCount(0);
  await trigger.click();
  await expect(draft).toHaveValue("initial");
});

test("keeps legacy Select popups inside the focus boundary", async ({
  page,
  drawerPage,
}) => {
  await drawerPage.open();
  await drawerPage.openDrawerButton.click();
  const drawer = drawerPage.testDrawerDialog;
  await drawer.getByRole("combobox").click();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(
    drawer.getByRole("status", { name: "Selected option" }),
  ).toHaveText("chosen");
  await expect(drawer).toBeVisible();
});

test("nested drawers close independently", async ({ page, drawerPage }) => {
  await drawerPage.open("&dismissible");
  await drawerPage.openDrawerButton.click();
  await drawerPage.openNestedDrawerButton.click();
  await expect(drawerPage.nestedDrawerDialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawerPage.nestedDrawerDialog).toBeHidden();
  await expect(drawerPage.testDrawerDialog).toBeVisible();
  await expect(drawerPage.closeCountIncludingHidden).toHaveText("0");
});

test("supports top placement and fits narrow viewports", async ({
  page,
  drawerPage,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await drawerPage.open("&side=top");
  await drawerPage.openDrawerButton.click();
  const drawer = drawerPage.testDrawerDialog;
  await expect(drawer).toHaveCSS("height", "240px");
  await expect(drawer).toHaveCSS("width", "375px");
  await expect(drawer).toHaveCSS("top", "0px");
});

test("named Drawer retains its dismissible defaults", async ({
  page,
  drawerPage,
}) => {
  await drawerPage.open("&named");
  await drawerPage.openDrawerButton.click();
  const drawer = drawerPage.testDrawerDialog;
  await expect(drawer).toHaveCSS("width", "378px");
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
});
