import { expect } from "@playwright/test";
import { test } from "./fixtures";

test("dynamic value picker opens on the first click and reopens after dismissal", async ({
  page,
  variableInsertPage,
}) => {
  await variableInsertPage.open();
  const trigger = variableInsertPage.insertDynamicValueButton;
  await trigger.click();
  await expect(variableInsertPage.dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(variableInsertPage.dialog).toBeHidden();
  await variableInsertPage.insertDynamicValueButton.click();
  await expect(variableInsertPage.dialog).toBeVisible();
});

test("fixed values preview, apply and cancel function edits, and insert the current expression", async ({
  page,
  variableInsertPage,
}) => {
  await variableInsertPage.open();
  await variableInsertPage.insertDynamicValueButton.click();
  await page.getByRole("button", { name: "Fixed value", exact: true }).click();
  const dialog = variableInsertPage.dialog;
  await dialog.getByRole("textbox").fill("hello");
  await expect(page.getByLabel("Variable expression")).toHaveText(
    "{{'hello'}}",
  );
  await expect(page.getByLabel("Variable preview")).toHaveText("hello");
  await page.getByRole("button", { name: "Add processing function" }).click();
  const modal = page.getByRole("dialog", { name: "Processing function" });
  await expect(modal).toBeVisible();
  await modal.getByText("upper", { exact: true }).click();
  await modal.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(modal).toBeHidden();
  await expect(page.getByLabel("Variable expression")).toHaveText(
    "{{'hello'|upper}}",
  );
  await expect(page.getByLabel("Variable preview")).toHaveText("HELLO");
  await page
    .getByRole("button", { name: "Edit function 1", exact: true })
    .click();
  await modal.getByText("lower", { exact: true }).click();
  await modal.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByLabel("Variable expression")).toHaveText(
    "{{'hello'|upper}}",
  );
  await page.getByRole("button", { name: "Insert", exact: true }).click();
  await expect(page.getByLabel("Inserted variable")).toHaveText(
    JSON.stringify({
      text: "{{'hello'|upper}}",
      operation: "fixed",
      action: 1,
    }),
  );
});

test("closing and reopening restores the source expression rather than the previous draft", async ({
  page,
  variableInsertPage,
}) => {
  await variableInsertPage.open("&mode=fixed&value=source&function");
  await variableInsertPage.insertDynamicValueButton.click();
  await expect(page.getByLabel("Variable expression")).toHaveText(
    "{{'source'|upper}}",
  );
  await variableInsertPage.dialog.getByRole("textbox").fill("unsaved");
  await expect(page.getByLabel("Variable expression")).toHaveText(
    "{{'unsaved'|upper}}",
  );
  await page.keyboard.press("Escape");
  await expect(variableInsertPage.dialog).toBeHidden();
  await variableInsertPage.insertDynamicValueButton.click();
  await expect(page.getByLabel("Variable expression")).toHaveText(
    "{{'source'|upper}}",
  );
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByLabel("Inserted variable")).toHaveText(
    JSON.stringify({
      text: "{{'source'|upper}}",
      operation: "fixed",
      action: 2,
    }),
  );
});

test("switching value modes clears the previous function draft", async ({
  page,
  variableInsertPage,
}) => {
  await variableInsertPage.open();
  await variableInsertPage.insertDynamicValueButton.click();
  await page.getByRole("button", { name: "Fixed value", exact: true }).click();
  await variableInsertPage.dialog.getByRole("textbox").fill("hello");
  await page.getByRole("button", { name: "Add processing function" }).click();
  const modal = page.getByRole("dialog", { name: "Processing function" });
  await modal.getByText("upper", { exact: true }).click();
  await modal.getByRole("button", { name: "Confirm", exact: true }).click();
  await page
    .getByRole("button", { name: "Back to variable types", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reference variable", exact: true })
    .click();
  await variableInsertPage.dialog.getByRole("textbox").fill("token");
  await expect(page.getByLabel("Variable expression")).toHaveText("{{token}}");
  await expect(
    page.getByRole("button", { name: "Edit function 1", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Replace", exact: true }).click();
  await expect(page.getByLabel("Inserted variable")).toHaveText(
    JSON.stringify({ text: "{{token}}", operation: "var", action: 0 }),
  );
});

test("Mock picker selections build executable expressions from the shared catalog", async ({
  page,
  variableInsertPage,
}) => {
  await variableInsertPage.open();
  await variableInsertPage.insertDynamicValueButton.click();
  await page.getByRole("button", { name: "Mock data", exact: true }).click();
  await page.getByRole("textbox", { name: "Search tree" }).fill("alpha");
  await page.getByRole("treeitem", { name: "alpha", exact: true }).click();
  await expect(page.getByLabel("Variable expression")).toHaveText(
    "{{$fakerjs.String.alpha}}",
  );
  await expect(page.getByLabel("Variable preview")).toHaveText(/^[a-zA-Z]+$/);
});
