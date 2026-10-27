import { test, expect, type Page } from "@playwright/test";

async function configure(page: Page, props: Record<string, unknown>) {
  await page.evaluate(
    (props) => (window as any).editorTest.configure(props),
    props,
  );
}
const value = (page: Page) =>
  page.evaluate(() => (window as any).editorTest.value());
const browserErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".code-editor-host .cm-content")).toBeVisible();
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page)).toEqual([]);
});

test("controlled typing, selection insertion, undo and external updates", async ({
  page,
}) => {
  const content = page.locator(".code-editor-host .cm-content");
  await configure(page, { value: "hello world" });
  await expect.poll(() => value(page)).toBe("hello world");
  await page.evaluate(() => {
    (window as any).editorTest.select(6, 11);
    (window as any).editorTest.insert("{{token}}");
  });
  await expect.poll(() => value(page)).toBe("hello {{token}}");
  await content.press("ControlOrMeta+z");
  await expect.poll(() => value(page)).toBe("hello world");
  await configure(page, { value: "new response" });
  await expect.poll(() => value(page)).toBe("new response");
  const changes = await page.evaluate(() =>
    (window as any).editorTest.changes(),
  );
  expect(changes).not.toContain("new response");
  await content.press("ControlOrMeta+End");
  await content.pressSequentially("!");
  await expect.poll(() => value(page)).toBe("new response!");
});

test("JSON formatting preserves comments and large numbers; invalid input stays untouched", async ({
  page,
}) => {
  const original = '{/*keep*/"id":9007199254740993123,"items":[1,2,],}';
  await configure(page, { value: original, language: "json" });
  await expect.poll(() => value(page)).toBe(original);
  await page.evaluate(() => (window as any).editorTest.format());
  const formatted = await value(page);
  expect(formatted).toContain("/*keep*/");
  expect(formatted).toContain("9007199254740993123");
  expect(formatted).toContain("\n");
  await configure(page, { value: "{invalid" });
  await expect.poll(() => value(page)).toBe("{invalid");
  await page.evaluate(() => (window as any).editorTest.format());
  expect(await value(page)).toBe("{invalid");
  expect(
    await page.evaluate(() =>
      (window as any).editorTest.jsonDiagnostics('{"a":1,}'),
    ),
  ).toEqual(
    expect.arrayContaining([expect.objectContaining({ severity: "warning" })]),
  );
  expect(
    await page.evaluate(() =>
      (window as any).editorTest.jsonDiagnostics('{"a":}'),
    ),
  ).toEqual(
    expect.arrayContaining([expect.objectContaining({ severity: "error" })]),
  );
});

test("read-only mode, wrap, line numbers and theme can change without losing content", async ({
  page,
}) => {
  await configure(page, {
    value: "protected",
    readOnly: true,
    options: { wordWrap: "off", lineNumbers: "off" },
  });
  const content = page.locator(".code-editor-host .cm-content");
  await expect(content).toHaveAttribute("contenteditable", "false");
  await expect(page.locator(".code-editor-host .cm-lineNumbers")).toHaveCount(
    0,
  );
  await expect(content).not.toHaveClass(/cm-lineWrapping/);
  await page.evaluate(() => (window as any).editorTest.insert("wrong"));
  expect(await value(page)).toBe("protected");
  await configure(page, {
    readOnly: false,
    options: { wordWrap: "on", lineNumbers: "on" },
  });
  await expect(content).toHaveAttribute("contenteditable", "true");
  await expect(content).toHaveClass(/cm-lineWrapping/);
  await page.evaluate(() =>
    (window as any).editorTest.setTheme("Default Light Modern"),
  );
  await expect
    .poll(() => page.evaluate(() => (window as any).editorTest.dark()))
    .toBe(false);
  expect(await value(page)).toBe("protected");
});

test("script completion replaces the entire dotted expression", async ({
  page,
}) => {
  await configure(page, { language: "javascript", value: "" });
  const content = page.locator(".code-editor-host .cm-content");
  await content.click();
  await content.pressSequentially("onapi.getGlobalV", { delay: 50 });
  await expect(page.locator(".cm-tooltip-autocomplete")).toBeVisible();
  await page
    .getByRole("option", { name: "onapi.getGlobalVariable", exact: true })
    .click();
  await expect.poll(() => value(page)).toBe("onapi.getGlobalVariable");
});

test("variable hover uses the current value lookup", async ({ page }) => {
  await configure(page, {
    language: "json",
    value: '{"token":"{{token}}"}',
    options: { hover: { enabled: true, delay: 10 } },
  });
  const line = page.locator(".code-editor-host .cm-line");
  await expect(line).toHaveText('{"token":"{{token}}"}');
  const box = await line.boundingBox();
  await page.mouse.move(box!.x + 14 * 8.4, box!.y + box!.height / 2);
  await expect(page.locator(".cm-tooltip-hover")).toContainText(
    "example-token",
  );
});

test("diff view highlights changes, updates and stays read-only", async ({
  page,
}) => {
  const contents = page.locator(".cm-mergeView .cm-content");
  await expect(contents).toHaveCount(2);
  await expect(contents.nth(0)).toHaveText('{"a":1}');
  await expect(contents.nth(1)).toHaveText('{"a":2}');
  await expect(contents.nth(1)).toHaveAttribute("contenteditable", "false");
  await expect(
    page.locator(".cm-mergeView .cm-changedLine").first(),
  ).toBeVisible();
  await page.evaluate(() =>
    (window as any).editorTest.setDiff({
      prevValue: "before",
      nextValue: "after",
    }),
  );
  await expect(contents.nth(1)).toHaveText("after");
});

test("every supported language and formatter loads in the browser", async ({
  page,
}) => {
  const languages = [
    "json",
    "javascript",
    "typescript",
    "xml",
    "html",
    "css",
    "sql",
    "python",
    "java",
    "php",
    "cpp",
    "graphql",
    "yaml",
    "shell",
    "go",
    "ruby",
    "swift",
    "csharp",
    "objectivec",
    "kotlin",
    "powershell",
    "text",
  ];
  for (const language of languages) {
    expect(
      await page.evaluate(
        (name) => (window as any).editorTest.language(name),
        language,
      ),
      language,
    ).toBe(2);
  }
  for (const [language, source] of [
    ["javascript", "const a={x:1}"],
    ["typescript", "const a:number=1"],
    ["xml", "<root><item>value</item></root>"],
    ["html", "<div><p>value</p></div>"],
    ["css", "a{color:red}"],
    ["graphql", "{user{id}}"],
    ["yaml", "a: [1,2]"],
  ]) {
    const result = await page.evaluate(
      ([source, language]) =>
        (window as any).editorTest.formatDocument(source, language),
      [source, language],
    );
    expect(result, language).not.toBe(source);
  }
});

test("a pending formatter never overwrites newer content", async ({ page }) => {
  await configure(page, { value: "const a={x:1}", language: "javascript" });
  await expect.poll(() => value(page)).toBe("const a={x:1}");
  await page.evaluate(() => {
    void (window as any).editorTest.format();
    (window as any).editorTest.select(0);
    (window as any).editorTest.insert("//new\n");
  });
  await expect.poll(() => value(page)).toBe("//new\nconst a={x:1}");
  await page.waitForLoadState("networkidle");
  expect(await value(page)).toBe("//new\nconst a={x:1}");
});

test("large read-only responses render a viewport and scroll to the end", async ({
  page,
}) => {
  const source = Array.from(
    { length: 20000 },
    (_, i) => `{"id":${i},"message":"response item ${i}"}`,
  ).join("\n");
  await configure(page, {
    value: source,
    readOnly: true,
    options: { wordWrap: "off" },
  });
  await expect
    .poll(() => page.evaluate(() => (window as any).editorTest.value().length))
    .toBe(source.length);
  expect(await page.locator(".code-editor-host .cm-line").count()).toBeLessThan(
    1000,
  );
  await page.evaluate(
    (length) => (window as any).editorTest.scrollTo(length),
    source.length,
  );
  await expect(page.locator(".code-editor-host .cm-content")).toContainText(
    "response item 19999",
  );
});
