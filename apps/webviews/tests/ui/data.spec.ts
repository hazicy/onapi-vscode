import { expect } from "@playwright/test";
import { test } from "./fixtures";

test.beforeEach(async ({ dataPage }) => {
  await dataPage.open();
});

test("table sorting, pagination and disabled selection stay consistent", async ({
  dataPage,
}) => {
  const table = dataPage.dataTableRegion;
  await expect(table.getByRole("row")).toHaveCount(3);
  await table.getByRole("button", { name: "Count" }).click();
  await expect(table.getByRole("row").nth(1)).toContainText("Second");
  await table.getByRole("checkbox", { name: "Select all rows" }).check();
  await expect(dataPage.selectedRows).toHaveText('["one","three"]');
  await expect(
    table.getByRole("row").nth(1).getByRole("checkbox"),
  ).toBeDisabled();
  await table.getByRole("button", { name: "Next", exact: true }).click();
  await expect(table.getByRole("row").nth(1)).toContainText("First");
  await expect(
    table.getByRole("row").nth(1).getByRole("checkbox"),
  ).toBeChecked();
});

test("tree cascades checks, reports half checks and respects disabled boundaries", async ({
  dataPage,
}) => {
  const tree = dataPage.filesTree;
  await tree.getByRole("checkbox", { name: "Select Alpha" }).check();
  await expect(dataPage.halfCheckedKeys).toHaveText('["folder"]');
  await tree
    .getByRole("checkbox", { name: "Select Folder", exact: true })
    .check();
  await expect(
    tree.getByRole("checkbox", { name: "Select Beta" }),
  ).toBeChecked();
  await expect(
    tree.getByRole("checkbox", { name: "Select Disabled" }),
  ).not.toBeChecked();
  await expect(dataPage.halfCheckedKeys).toHaveText("[]");
  await tree.getByRole("checkbox", { name: "Select Alpha" }).uncheck();
  await expect(dataPage.halfCheckedKeys).toHaveText('["folder"]');
  await dataPage.clearTreeChecksButton.click();
  await expect(
    tree.getByRole("checkbox", { name: "Select Beta" }),
  ).not.toBeChecked();
});

test("tree keyboard navigation and lazy expansion work without duplicate loads", async ({
  dataPage,
}) => {
  const folder = dataPage.lazyFolderTreeitem;
  await folder.focus();
  await folder.press("ArrowRight");
  const child = dataPage.loadedChildTreeitem;
  await expect(child).toBeVisible();
  await folder.press("ArrowDown");
  await expect(child).toBeFocused();
  await dataPage.collapseLazyFolderButton.click();
  await expect(child).toHaveCount(0);
  await dataPage.expandLazyFolderButton.click();
  await expect(child).toBeVisible();
  await expect(dataPage.loadCount).toHaveText("1");
});

test("tree select supports custom fields, search and controlled reset", async ({
  dataPage,
}) => {
  const picker = dataPage.folderChoiceCombobox;
  await picker.click();
  await dataPage.searchTreeTextbox.fill("Second");
  await dataPage.secondChoiceTreeitem.click();
  await expect(dataPage.chosenFolder).toHaveText("second");
  await expect(picker).toContainText("Second choice");
  await dataPage.resetChoiceButton.click();
  await expect(picker).not.toContainText("Second choice");
  await picker.click();
  await expect(dataPage.firstChoiceTreeitem).toBeVisible();
});

test("native picker filters files, limits count, removes files and reselects the same file", async ({
  dataPage,
}) => {
  const input = dataPage.localFilesRegion.locator('input[type="file"]');
  const file = (name: string) => ({
    name,
    mimeType: "application/json",
    buffer: Buffer.from("{}"),
  });
  await input.setInputFiles([
    file("ignore.json"),
    file("one.json"),
    file("two.json"),
    file("three.json"),
    { name: "bad.txt", mimeType: "text/plain", buffer: Buffer.from("bad") },
  ]);
  await expect(dataPage.fileNames).toHaveText("two.json,three.json");
  await expect(dataPage.fileChanges).toHaveText("3");
  await dataPage.removeTwoJsonButton.click();
  await input.setInputFiles(file("three.json"));
  await expect(dataPage.fileChanges).toHaveText("5");
});

test("table rows retain draggable handles and resizable headers", async ({
  page,
  dataPage,
}) => {
  const region = dataPage.resizableDraggableTableRegion;
  await expect(region.locator(".react-resizable-handle")).toHaveCount(2);
  const rows = region.getByRole("row");
  const before = await rows.nth(1).getByRole("cell").nth(1).boundingBox();
  const handle = region.locator(".react-resizable-handle").first();
  const box = await handle.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + 70, box!.y + box!.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect
    .poll(
      async () =>
        (await rows.nth(1).getByRole("cell").nth(1).boundingBox())!.width,
    )
    .toBeGreaterThan(before!.width);
  // The drag handle is mounted into the dedicated sort cell.
  await expect(
    rows.nth(1).getByRole("cell").first().locator('[style*="cursor: move"]'),
  ).toHaveCount(1);
});

test("tree drag moves a leaf into a folder and rejects moving a folder into its descendant", async ({
  dataPage,
}) => {
  const tree = dataPage.filesTree;
  await tree
    .getByRole("treeitem", { name: "Alpha", exact: true })
    .dragTo(tree.getByRole("treeitem", { name: "Destination", exact: true }));
  await expect(dataPage.treeDrop).toContainText('"dragged":"a"');
  await expect(dataPage.treeDrop).toContainText('"target":"destination"');
  await expect(dataPage.treeDrop).toContainText('"gap":false');
  const previous = await dataPage.treeDrop.innerText();
  await tree
    .getByRole("treeitem", { name: "Folder", exact: true })
    .dragTo(tree.getByRole("treeitem", { name: "Beta", exact: true }));
  await expect(dataPage.treeDrop).toHaveText(previous);
});

test("table drag reorders records through the existing sortable handle", async ({
  page,
  dataPage,
}) => {
  const region = dataPage.resizableDraggableTableRegion;
  const rows = region.getByRole("row");
  const handle = rows
    .nth(1)
    .getByRole("cell")
    .first()
    .locator('[style*="cursor: move"]');
  await handle.scrollIntoViewIfNeeded();
  const source = await handle.boundingBox();
  const target = await rows.nth(3).boundingBox();
  await page.mouse.move(
    source!.x + source!.width / 2,
    source!.y + source!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(source!.x + source!.width / 2, source!.y + 10, {
    steps: 3,
  });
  await page.mouse.move(
    source!.x + source!.width / 2,
    target!.y + target!.height / 2,
    { steps: 10 },
  );
  await page.mouse.up();
  await expect(dataPage.rowOrder).toHaveText("two,three,one");
});

test("dropping local files uses the same validation pipeline as file selection", async ({
  page,
  dataPage,
}) => {
  const transfer = await page.evaluateHandle(() => {
    const data = new DataTransfer();
    data.items.add(
      new File(["{}"], "dropped.json", { type: "application/json" }),
    );
    data.items.add(new File(["bad"], "rejected.txt", { type: "text/plain" }));
    return data;
  });
  await dataPage.localFilesRegion
    .getByRole("button", { name: "Choose file", exact: true })
    .dispatchEvent("drop", { dataTransfer: transfer });
  await expect(dataPage.fileNames).toHaveText("dropped.json");
  await expect(dataPage.fileChanges).toHaveText("1");
});

test("tree keyboard Enter selects a focused item and Space toggles its checkbox", async ({
  dataPage,
}) => {
  const tree = dataPage.filesTree;
  const folder = tree.getByRole("treeitem", { name: "Folder", exact: true });
  await folder.focus();
  await folder.press("ArrowDown");
  const alpha = tree.getByRole("treeitem", { name: "Alpha", exact: true });
  await expect(alpha).toBeFocused();
  await alpha.press("Enter");
  await expect(alpha).toHaveAttribute("aria-selected", "true");
  await alpha.press("Space");
  await expect(
    tree.getByRole("checkbox", { name: "Select Alpha" }),
  ).toBeChecked();
  await expect(dataPage.halfCheckedKeys).toHaveText('["folder"]');
});
