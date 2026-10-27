import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => Boolean((window as any).editorTest));
});

test("response formatting preserves JSON numeric literals, comments and invalid bodies", async ({
  page,
}) => {
  const source = '{/*keep*/"id":9007199254740993123,"nested":{"a":1}}';
  const result = await page.evaluate(
    (value) => (window as any).editorTest.formatResponse(value),
    source,
  );
  expect(result.mode).toBe("json");
  expect(result.value).toContain("9007199254740993123");
  expect(result.value).toContain("/*keep*/");
  expect(result.value).toContain("\n");
  const invalid = await page.evaluate(() =>
    (window as any).editorTest.formatResponse('{"a":', "json"),
  );
  expect(invalid.value).toBe('{"a":');
  const json5 = await page.evaluate(() =>
    (window as any).editorTest.formatResponse("{name:'sample',items:[1,2,],}"),
  );
  expect(json5.mode).toBe("json");
  expect(json5.value).toContain("sample");
});

test("response HTML and XML use the browser Prettier parsers", async ({
  page,
}) => {
  for (const [source, hint, mode] of [
    [
      "<!doctype html><html><body><div><p>Hello</p></div></body></html>",
      undefined,
      "html",
    ],
    [
      '<root><item value="1">Hello</item><item value="2"/></root>',
      undefined,
      "xml",
    ],
    ["<div><span>Hello</span><span>World</span></div>", "html", "html"],
  ]) {
    const result = await page.evaluate(
      ({ source, hint }) =>
        (window as any).editorTest.formatResponse(source, hint),
      { source, hint },
    );
    expect(result.mode).toBe(mode);
    expect(result.value).toContain("Hello");
    expect(result.value).toContain("\n");
  }
});

test("a delayed response formatter cannot replace a newer response", async ({
  page,
}) => {
  let release!: () => void;
  let blocked!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requested = new Promise<void>((resolve) => {
    blocked = resolve;
  });
  await page.route("**/babel-*.js", async (route) => {
    blocked();
    await gate;
    await route.continue();
  });
  await page.evaluate(() =>
    (window as any).editorTest.setResponse({
      value: '{"old":1}',
      mode: "json",
    }),
  );
  await requested;
  await page.evaluate(() =>
    (window as any).editorTest.setResponse({
      value: "new response",
      mode: "text",
    }),
  );
  await expect(page.getByLabel("Formatted response")).toHaveText(
    "new response",
  );
  release();
  await page.waitForLoadState("networkidle");
  await expect(page.getByLabel("Formatted response")).toHaveText(
    "new response",
  );
});

test("oversized response bodies remain unchanged", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const source = '{"body":"' + "a".repeat(5 * 1024 * 1024) + '"}';
    const result = await (window as any).editorTest.formatResponse(
      source,
      "json",
    );
    return result.value === source;
  });
  expect(result).toBe(true);
});
