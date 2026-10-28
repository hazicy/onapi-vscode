import { expect, type Page } from "@playwright/test";
import { test } from "./fixtures";

const browserErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page, editorPage }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  await editorPage.open();
  await expect(editorPage.content).toBeVisible();
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page)).toEqual([]);
});

test("controlled typing, selection insertion, undo and external updates", async ({
  editorPage,
}) => {
  const content = editorPage.content;
  await editorPage.configure({ value: "hello world" });
  await expect.poll(() => editorPage.value()).toBe("hello world");
  await editorPage.replaceSelection(6, 11, "{{token}}");
  await expect.poll(() => editorPage.value()).toBe("hello {{token}}");
  await content.press("ControlOrMeta+z");
  await expect.poll(() => editorPage.value()).toBe("hello world");
  await editorPage.configure({ value: "new response" });
  await expect.poll(() => editorPage.value()).toBe("new response");
  const changes = await editorPage.changes();
  expect(changes).not.toContain("new response");
  await editorPage.editor.append("!");
  await expect.poll(() => editorPage.value()).toBe("new response!");
});

test("JSON formatting preserves comments and large numbers; invalid input stays untouched", async ({
  editorPage,
}) => {
  const original = '{/*keep*/"id":9007199254740993123,"items":[1,2,],}';
  await editorPage.configure({ value: original, language: "json" });
  await expect.poll(() => editorPage.value()).toBe(original);
  await editorPage.format();
  const formatted = await editorPage.value();
  expect(formatted).toContain("/*keep*/");
  expect(formatted).toContain("9007199254740993123");
  expect(formatted).toContain("\n");
  await editorPage.configure({ value: "{invalid" });
  await expect.poll(() => editorPage.value()).toBe("{invalid");
  await editorPage.format();
  expect(await editorPage.value()).toBe("{invalid");
  expect(await editorPage.diagnostics('{"a":1,}')).toEqual(
    expect.arrayContaining([expect.objectContaining({ severity: "warning" })]),
  );
  expect(await editorPage.diagnostics('{"a":}')).toEqual(
    expect.arrayContaining([expect.objectContaining({ severity: "error" })]),
  );
});

test("read-only mode, wrap, line numbers and theme can change without losing content", async ({
  editorPage,
}) => {
  await editorPage.configure({
    value: "protected",
    readOnly: true,
    options: { wordWrap: "off", lineNumbers: "off" },
  });
  const content = editorPage.content;
  await expect(content).toHaveAttribute("contenteditable", "false");
  await expect(editorPage.lineNumbers).toHaveCount(0);
  await expect(content).not.toHaveClass(/cm-lineWrapping/);
  await editorPage.insert("wrong");
  expect(await editorPage.value()).toBe("protected");
  await editorPage.configure({
    readOnly: false,
    options: { wordWrap: "on", lineNumbers: "on" },
  });
  await expect(content).toHaveAttribute("contenteditable", "true");
  await expect(content).toHaveClass(/cm-lineWrapping/);
  await editorPage.setTheme("Default Light Modern");
  await expect.poll(() => editorPage.isDark()).toBe(false);
  expect(await editorPage.value()).toBe("protected");
});

test("script completion replaces the entire dotted expression", async ({
  editorPage,
}) => {
  await editorPage.configure({ language: "javascript", value: "" });
  const content = editorPage.content;
  await content.click();
  await content.pressSequentially("onapi.getGlobalV", { delay: 50 });
  await expect(editorPage.completions).toBeVisible();
  await editorPage.completion("onapi.getGlobalVariable").click();
  await expect.poll(() => editorPage.value()).toBe("onapi.getGlobalVariable");
});

test("variable hover uses the current value lookup", async ({
  page,
  editorPage,
}) => {
  await editorPage.configure({
    language: "json",
    value: '{"token":"{{token}}"}',
    options: { hover: { enabled: true, delay: 10 } },
  });
  const line = editorPage.lines;
  await expect(line).toHaveText('{"token":"{{token}}"}');
  const box = await line.boundingBox();
  await page.mouse.move(box!.x + 14 * 8.4, box!.y + box!.height / 2);
  await expect(editorPage.hoverTooltip).toContainText("example-token");
});

test("diff view highlights changes, updates and stays read-only", async ({
  editorPage,
}) => {
  const contents = editorPage.diffContents;
  await expect(contents).toHaveCount(2);
  await expect(contents.nth(0)).toHaveText('{"a":1}');
  await expect(contents.nth(1)).toHaveText('{"a":2}');
  await expect(contents.nth(1)).toHaveAttribute("contenteditable", "false");
  await expect(editorPage.changedLines.first()).toBeVisible();
  await editorPage.setDiff({
    prevValue: "before",
    nextValue: "after",
  });
  await expect(contents.nth(1)).toHaveText("after");
});

test("every supported language and formatter loads in the browser", async ({
  editorPage,
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
    expect(await editorPage.loadLanguage(language), language).toBe(2);
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
    const result = await editorPage.formatDocument(source, language);
    if (language === "xml") {
      expect(result).toBe(source);
    } else {
      expect(result, language).not.toBe(source);
    }
  }
});

test("a pending formatter never overwrites newer content", async ({
  page,
  editorPage,
}) => {
  await editorPage.configure({
    value: "const a={x:1}",
    language: "javascript",
  });
  await expect.poll(() => editorPage.value()).toBe("const a={x:1}");
  await editorPage.formatThenPrepend("//new\n");
  await expect.poll(() => editorPage.value()).toBe("//new\nconst a={x:1}");
  await page.waitForLoadState("networkidle");
  expect(await editorPage.value()).toBe("//new\nconst a={x:1}");
});

test("large read-only responses render a viewport and scroll to the end", async ({
  editorPage,
}) => {
  const source = Array.from(
    { length: 20000 },
    (_, i) => `{"id":${i},"message":"response item ${i}"}`,
  ).join("\n");
  await editorPage.configure({
    value: source,
    readOnly: true,
    options: { wordWrap: "off" },
  });
  await expect
    .poll(async () => (await editorPage.value()).length)
    .toBe(source.length);
  expect(await editorPage.lines.count()).toBeLessThan(1000);
  await editorPage.scrollTo(source.length);
  await expect(editorPage.content).toContainText("response item 19999");
});

test("editor surfaces follow live VS Code theme variables", async ({
  page,
  editorPage,
}) => {
  await editorPage.configure({
    value: "const answer = 42",
    language: "javascript",
  });
  await page.evaluate(() => {
    const style = document.documentElement.style;
    style.setProperty("--vscode-editor-background", "#123456");
    style.setProperty("--vscode-editorGutter-background", "#234567");
    style.setProperty("--vscode-editorLineNumber-foreground", "#abcdef");
    style.setProperty("--vscode-editorCursor-foreground", "#fedcba");
    style.setProperty("--vscode-editor-lineHighlightBackground", "#345678");
  });
  const host = page.locator(".code-editor-host");
  await expect(host.locator(".cm-editor")).toHaveCSS(
    "background-color",
    "rgb(18, 52, 86)",
  );
  await expect(host.locator(".cm-gutters")).toHaveCSS(
    "background-color",
    "rgb(35, 69, 103)",
  );
  await expect(host.locator(".cm-gutters")).toHaveCSS(
    "color",
    "rgb(171, 205, 239)",
  );
  await expect(host.locator(".cm-activeLine")).toHaveCSS(
    "background-color",
    "rgb(52, 86, 120)",
  );
  await editorPage.content.click();
  await expect(host.locator(".cm-cursor").first()).toHaveCSS(
    "border-left-color",
    "rgb(254, 220, 186)",
  );
  await page.evaluate(() =>
    document.documentElement.style.setProperty(
      "--vscode-editorGutter-background",
      "#654321",
    ),
  );
  await expect(host.locator(".cm-gutters")).toHaveCSS(
    "background-color",
    "rgb(101, 67, 33)",
  );
  expect(await editorPage.value()).toBe("const answer = 42");
});
