import { expect } from "@playwright/test";
import { test } from "./fixtures";

test.beforeEach(async ({ editorPage }) => {
  await editorPage.open();
});

test("response formatting preserves JSON numeric literals, comments and invalid bodies", async ({
  editorPage,
}) => {
  const source = '{/*keep*/"id":9007199254740993123,"nested":{"a":1}}';
  const result = await editorPage.formatResponse(source);
  expect(result.mode).toBe("json");
  expect(result.value).toContain("9007199254740993123");
  expect(result.value).toContain("/*keep*/");
  expect(result.value).toContain("\n");
  const invalid = await editorPage.formatResponse('{"a":', "json");
  expect(invalid.value).toBe('{"a":');
  const json5 = await editorPage.formatResponse(
    "{name:'sample',items:[1,2,],}",
  );
  expect(json5.mode).toBe("json");
  expect(json5.value).toContain("sample");
});

test("response HTML uses Oxfmt and XML remains unchanged", async ({
  editorPage,
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
  ] as const) {
    const result = await editorPage.formatResponse(source, hint);
    expect(result.mode).toBe(mode);
    expect(result.value).toContain("Hello");
    if (mode === "xml") {
      expect(result.value).toBe(source);
    } else {
      expect(result.value).toContain("\n");
    }
  }
});

test("a delayed response formatter cannot replace a newer response", async ({
  page,
  editorPage,
}) => {
  await page.evaluate(() => {
    const send = window.vscode.postMessage.bind(window.vscode);
    window.vscode.postMessage = (message: any) => {
      if (
        message.action === "formatDocument" &&
        message.data.source.includes('"old"')
      ) {
        (window as any).releaseOldFormat = () => send(message);
      } else {
        send(message);
      }
    };
  });
  await editorPage.setResponse({
    value: '{"old":1}',
    mode: "json",
  });
  await page.waitForFunction(() => !!(window as any).releaseOldFormat);
  await editorPage.setResponse({
    value: "new response",
    mode: "text",
  });
  await expect(editorPage.formattedResponse).toHaveText("new response");
  await page.evaluate(() => (window as any).releaseOldFormat());
  await page.waitForLoadState("networkidle");
  await expect(editorPage.formattedResponse).toHaveText("new response");
});

test("oversized response bodies remain unchanged", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const source = '{"body":"' + "a".repeat(5 * 1024 * 1024) + '"}';
    const result = await window.editorTest.formatResponse(source, "json");
    return result.value === source;
  });
  expect(result).toBe(true);
});
