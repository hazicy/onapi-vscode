import { expect, test } from "@playwright/test";

test("request labels and body formats follow language changes", async ({
  page,
}) => {
  await page.goto("/?requestPanel&localeTest&language=zh-cn");
  await expect(page.getByRole("tab", { name: /^请求头/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: /^查询参数/ })).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "请求体", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "Cookie", exact: true }),
  ).toBeVisible();
  await page.getByRole("combobox", { name: "请求体类型" }).click();
  await expect(
    page.getByRole("option", { name: "多部分表单", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("option", { name: "JSON", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Switch fixture language" }).click();
  await expect(page.getByRole("tab", { name: /^Headers/ })).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "Body", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Body type" })).toBeVisible();
});

test("MCP connection controls and settings use a single language", async ({
  page,
}) => {
  await page.goto("/?aiMcp=mcp&localeTest&language=zh-cn");
  await expect(
    page.getByRole("button", { name: "连接", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "设置", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "传输方式", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Switch fixture language" }).click();
  await expect(
    page.getByRole("button", { name: "Connect", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Transport", exact: true }),
  ).toBeVisible();
});

test("gRPC help, states and metadata fields follow language changes", async ({
  page,
}) => {
  await page.goto("/?grpc&localeTest&language=zh-cn");
  await expect(
    page.getByRole("button", { name: "加载服务", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("就绪", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "元数据", exact: true }).first().click();
  await page.getByRole("button", { name: "+ 添加元数据", exact: true }).click();
  await expect(
    page.getByPlaceholder("值或 {{variable}}", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Switch fixture language" }).click();
  await expect(page.getByText("Ready", { exact: true })).toBeVisible();
  await expect(
    page.getByPlaceholder("Value or {{variable}}", { exact: true }),
  ).toBeVisible();
});
