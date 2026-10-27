import { expect } from "@playwright/test";
import { test } from "./fixtures";
test.beforeEach(async ({ basePage }) => {
  await basePage.open();
});
test("component className props preserve component overrides, size variants, and wrapper scope", async ({
  basePage,
}) => {
  await expect(basePage.smallButton).toHaveCSS("min-height", "24px");
  await expect(basePage.largeButton).toHaveCSS("min-height", "40px");
  await expect(basePage.styledEmptyDescription).toHaveCSS(
    "color",
    "rgb(10, 20, 30)",
  );
  await expect(basePage.plainEmptyDescription).toHaveCSS(
    "color",
    "rgb(4, 5, 6)",
  );
});
test("controls propagate values and support keyboard selection", async ({
  basePage,
}) => {
  await basePage.textValueTextbox.fill("typed");
  await basePage.acceptTermsCheckbox.check();
  await basePage.enableFeatureSwitch.check();
  await basePage.modeBRadio.check();
  await basePage.searchChoiceCombobox.fill("Second");
  await basePage.secondOption.click();
  await expect(basePage.controlResultStatus).toContainText('"value":"two"');
  await expect(basePage.controlResultStatus).toContainText('"checked":true');
  await expect(basePage.controlResultStatus).toContainText('"radio":"b"');
});
test("multiple select adds and removes values", async ({ basePage }) => {
  await basePage.multipleChoicesCombobox.fill("Alpha");
  await basePage.alphaOption.click();
  await expect(basePage.controlResultStatus).toContainText('"selected":["a"]');
  await basePage.removeAlphaButton.click();
  await expect(basePage.controlResultStatus).toContainText('"selected":[]');
});
test("tabs and collapsible panels change visible content", async ({
  basePage,
}) => {
  await basePage.secondTab.click();
  await expect(basePage.firstPanel).toBeHidden();
  await expect(basePage.secondPanel).toHaveText("Second panel");
  await basePage.expandDetailsButton.click();
  await expect(basePage.expandedContent).toBeVisible();
});
test("form validates required fields and submits current input", async ({
  basePage,
}) => {
  await basePage.saveFormButton.click();
  await expect(basePage.alert).toContainText("Name is required");
  await basePage.requiredNameTextbox.fill("valid");
  await basePage.saveFormButton.click();
  await expect(basePage.submittedValueStatus).toHaveText("valid");
});
test("table selects rows and trees expose children", async ({ basePage }) => {
  const row = basePage.firstRow;
  await row.getByRole("checkbox").check();
  await expect(basePage.rowSelectionStatus).toHaveText("1");
  await expect(basePage.leafNodeTreeitem).toBeVisible();
});
test("menu actions, confirmation dialogs and toast feedback work", async ({
  basePage,
}) => {
  await basePage.openMenuButton.click();
  await basePage.runMenuActionMenuitem.click();
  await expect(basePage.menuResultStatus).toHaveText("item");
  await basePage.openConfirmationButton.click();
  const dialog = basePage.confirmActionDialog;
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "OK", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(basePage.menuResultStatus).toHaveText("confirmed");
  await basePage.showToastButton.click();
  await expect(basePage.savedSuccessfully).toBeVisible();
});
test("manual file upload reports a selected file without sending a request", async ({
  basePage,
}) => {
  await basePage.fileInput.setInputFiles({
    name: "example.json",
    mimeType: "application/json",
    buffer: Buffer.from("{}"),
  });
  await expect(basePage.uploadedNameStatus).toHaveText("example.json");
});

test("context menus open on right click and async confirmations resolve on choice", async ({
  basePage,
}) => {
  await basePage.contextTargetButton.click({ button: "right" });
  await basePage.runContextActionMenuitem.click();
  await expect(basePage.menuResultStatus).toHaveText("context");
  await basePage.awaitConfirmationButton.click();
  await basePage.awaitConfirmationDialog
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await expect(basePage.menuResultStatus).toHaveText("false");
  await basePage.awaitConfirmationButton.click();
  await basePage.awaitConfirmationDialog
    .getByRole("button", { name: "OK", exact: true })
    .click();
  await expect(basePage.menuResultStatus).toHaveText("true");
});
test("tag separators and tree selection preserve their values", async ({
  page,
  basePage,
}) => {
  await basePage.tagValuesCombobox.fill("red,blue,");
  await page.keyboard.press("Escape");
  await expect(basePage.controlResultStatus).toContainText(
    '"selected":["red","blue"]',
  );
  await page.keyboard.press("Escape");
  await basePage.treeChoice.first().click();
  await basePage.leafChoice.click();
  await expect(basePage.controlResultStatus).toContainText('"value":"leaf"');
});
test("numeric input and clearable text update controlled state", async ({
  basePage,
}) => {
  await basePage.textValueTextbox.fill("clear me");
  await basePage.clearButton.click();
  await expect(basePage.textValueTextbox).toHaveValue("");
  await basePage.increaseButton.click();
  await expect(basePage.controlResultStatus).toContainText('"number":3');
});
test("theme changes update CSS variables and extracted conditional styles", async ({
  themePage,
}) => {
  await themePage.open();
  const state = themePage.styledState;
  await expect(state).toHaveCSS("color", "rgb(22, 119, 255)");
  await expect(state).toHaveCSS("cursor", "not-allowed");
  const assertion = themePage.assertionState;
  await expect(assertion).toHaveCSS("color", "rgb(255, 88, 62)");
  await expect(assertion).toHaveCSS(
    "background-color",
    "color(srgb 1 0.345098 0.243137 / 0.08)",
  );
  const directionPanels = [themePage.graphQLDirection, themePage.sseDirection];
  for (const panel of directionPanels) {
    await expect(panel).toHaveCSS("padding-bottom", "0px");
  }
  const controls = [
    themePage.themeButton,
    themePage.themeInputTextbox,
    themePage.themeSelectCombobox.locator(".."),
  ];
  for (const control of controls) {
    await expect(control).toHaveCSS("border-radius", "4px");
  }
  await themePage.toggleThemeButton.click();
  await expect(state).toHaveCSS("color", "rgb(255, 0, 0)");
  await expect(state).toHaveCSS("cursor", "auto");
  await expect(assertion).toHaveCSS("color", "rgb(38, 206, 164)");
  await expect(assertion).toHaveCSS(
    "background-color",
    "color(srgb 0.14902 0.807843 0.643137 / 0.08)",
  );
  for (const panel of directionPanels) {
    await expect(panel).toHaveCSS("padding-bottom", "12px");
  }
  await expect(themePage.html).toHaveCSS("--font-size-14", "16px");
  for (const control of controls) {
    await expect(control).toHaveCSS("border-radius", "4px");
  }
  await themePage.html.evaluate((root) => {
    root.style.setProperty("--vscode-cornerRadius-small", "5px");
  });
  for (const control of controls) {
    await expect(control).toHaveCSS("border-radius", "5px");
  }
  await themePage.html.evaluate((root) => {
    root.style.setProperty("--vscode-focusBorder", "rgb(200, 100, 50)");
  });
  await controls[1].focus();
  await expect(controls[1]).toHaveCSS("border-top-color", "rgb(200, 100, 50)");
});
