import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?data");
});

test("table sorting, pagination and disabled selection stay consistent", async ({
  page,
}) => {
  const table = page.getByRole("region", { name: "Data table", exact: true });
  await expect(table.getByRole("row")).toHaveCount(3);
  await table.getByRole("button", { name: "Count" }).click();
  await expect(table.getByRole("row").nth(1)).toContainText("Second");
  await table.getByRole("checkbox", { name: "Select all rows" }).check();
  await expect(page.getByLabel("Selected rows")).toHaveText('["one","three"]');
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
  page,
}) => {
  const tree = page.getByRole("tree", { name: "Files", exact: true });
  await tree.getByRole("checkbox", { name: "Select Alpha" }).check();
  await expect(page.getByLabel("Half checked keys")).toHaveText('["folder"]');
  await tree
    .getByRole("checkbox", { name: "Select Folder", exact: true })
    .check();
  await expect(
    tree.getByRole("checkbox", { name: "Select Beta" }),
  ).toBeChecked();
  await expect(
    tree.getByRole("checkbox", { name: "Select Disabled" }),
  ).not.toBeChecked();
  await expect(page.getByLabel("Half checked keys")).toHaveText("[]");
  await tree.getByRole("checkbox", { name: "Select Alpha" }).uncheck();
  await expect(page.getByLabel("Half checked keys")).toHaveText('["folder"]');
  await page.getByRole("button", { name: "Clear tree checks" }).click();
  await expect(
    tree.getByRole("checkbox", { name: "Select Beta" }),
  ).not.toBeChecked();
});

test("tree keyboard navigation and lazy expansion work without duplicate loads", async ({
  page,
}) => {
  const folder = page.getByRole("treeitem", {
    name: "Lazy folder",
    exact: true,
  });
  await folder.focus();
  await folder.press("ArrowRight");
  const child = page.getByRole("treeitem", {
    name: "Loaded child",
    exact: true,
  });
  await expect(child).toBeVisible();
  await folder.press("ArrowDown");
  await expect(child).toBeFocused();
  await page.getByRole("button", { name: "Collapse Lazy folder" }).click();
  await expect(child).toHaveCount(0);
  await page.getByRole("button", { name: "Expand Lazy folder" }).click();
  await expect(child).toBeVisible();
  await expect(page.getByLabel("Load count")).toHaveText("1");
});

test("tree select supports custom fields, search and controlled reset", async ({
  page,
}) => {
  const picker = page.getByRole("combobox", { name: "Folder choice" });
  await picker.click();
  await page.getByRole("textbox", { name: "Search tree" }).fill("Second");
  await page
    .getByRole("treeitem", { name: "Second choice", exact: true })
    .click();
  await expect(page.getByLabel("Chosen folder")).toHaveText("second");
  await expect(picker).toContainText("Second choice");
  await page.getByRole("button", { name: "Reset choice" }).click();
  await expect(picker).not.toContainText("Second choice");
  await picker.click();
  await expect(
    page.getByRole("treeitem", { name: "First choice", exact: true }),
  ).toBeVisible();
});

test("native picker filters files, limits count, removes files and reselects the same file", async ({
  page,
}) => {
  const input = page
    .getByRole("region", { name: "Local files" })
    .locator('input[type="file"]');
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
  await expect(page.getByLabel("File names")).toHaveText("two.json,three.json");
  await expect(page.getByLabel("File changes")).toHaveText("3");
  await page
    .getByRole("button", { name: "Remove two.json", exact: true })
    .click();
  await input.setInputFiles(file("three.json"));
  await expect(page.getByLabel("File changes")).toHaveText("5");
});

test("table rows retain draggable handles and resizable headers", async ({
  page,
}) => {
  const region = page.getByRole("region", {
    name: "Resizable draggable table",
  });
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
  page,
}) => {
  const tree = page.getByRole("tree", { name: "Files", exact: true });
  await tree
    .getByRole("treeitem", { name: "Alpha", exact: true })
    .dragTo(tree.getByRole("treeitem", { name: "Destination", exact: true }));
  await expect(page.getByLabel("Tree drop")).toContainText('"dragged":"a"');
  await expect(page.getByLabel("Tree drop")).toContainText(
    '"target":"destination"',
  );
  await expect(page.getByLabel("Tree drop")).toContainText('"gap":false');
  const previous = await page.getByLabel("Tree drop").innerText();
  await tree
    .getByRole("treeitem", { name: "Folder", exact: true })
    .dragTo(tree.getByRole("treeitem", { name: "Beta", exact: true }));
  await expect(page.getByLabel("Tree drop")).toHaveText(previous);
});

test("table drag reorders records through the existing sortable handle", async ({
  page,
}) => {
  const region = page.getByRole("region", {
    name: "Resizable draggable table",
  });
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
  await expect(page.getByLabel("Row order")).toHaveText("two,three,one");
});

test("dropping local files uses the same validation pipeline as file selection", async ({
  page,
}) => {
  const transfer = await page.evaluateHandle(() => {
    const data = new DataTransfer();
    data.items.add(
      new File(["{}"], "dropped.json", { type: "application/json" }),
    );
    data.items.add(new File(["bad"], "rejected.txt", { type: "text/plain" }));
    return data;
  });
  await page
    .getByRole("region", { name: "Local files" })
    .getByRole("button", { name: "Choose file", exact: true })
    .dispatchEvent("drop", { dataTransfer: transfer });
  await expect(page.getByLabel("File names")).toHaveText("dropped.json");
  await expect(page.getByLabel("File changes")).toHaveText("1");
});

test("tree keyboard Enter selects a focused item and Space toggles its checkbox", async ({
  page,
}) => {
  const tree = page.getByRole("tree", { name: "Files", exact: true });
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
  await expect(page.getByLabel("Half checked keys")).toHaveText('["folder"]');
});
