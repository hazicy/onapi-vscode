import { expect, test } from "@playwright/test";

for (const multiline of [false, true]) {
  test(`typing and deleting variables retains focus and the input node (${multiline ? "textarea" : "input"})`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(`/?variableInput${multiline ? "&multiline" : ""}`);
    const input = page.getByPlaceholder("Request value");
    await input.fill("");
    const original = await input.elementHandle();
    await input.pressSequentially("{{host}}/users");
    await expect(input).toHaveValue("{{host}}/users");
    await expect(input).toBeFocused();
    await input.pressSequentially("/{{");
    await expect(input).toBeFocused();
    await input.pressSequentially("zero}}/tail");
    await expect(input).toHaveValue("{{host}}/users/{{zero}}/tail");
    await input.fill("{{host}}");
    await input.press("End");
    await input.press("Backspace");
    await expect(input).toBeFocused();
    await input.pressSequentially("}/after");
    await expect(input).toHaveValue("{{host}}/after");
    expect(
      await input.evaluate(
        (element, original) => element === original,
        original,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });

  test(`variable highlighting and actual values survive editing (${multiline ? "textarea" : "input"})`, async ({
    page,
  }) => {
    await page.goto(`/?variableInput${multiline ? "&multiline" : ""}`);
    const input = page.getByPlaceholder("Request value");
    const marks = page.locator("mark");
    await expect(marks).toHaveCount(4);
    expect(
      await marks
        .first()
        .evaluate((mark) => getComputedStyle(mark).backgroundColor),
    ).not.toBe("rgba(0, 0, 0, 0)");
    await input.hover();
    const tip = page.getByRole("tooltip");
    await expect(tip).toContainText("https://first.example");
    await expect(tip).toContainText("Empty string");
    await expect(tip).toContainText("Undefined");
    await expect(
      tip.getByText("collection zero", { exact: true }),
    ).toBeVisible();
    await page.mouse.move(900, 600);
    await expect(tip).toBeHidden();
    await page.getByRole("button", { name: "Switch environment" }).click();
    await input.hover();
    await expect(tip).toContainText("https://second.example");
    await page.mouse.move(900, 600);
    await expect(tip).toBeHidden();
    await input.focus();
    await expect(tip).toContainText("https://second.example");
    await input.fill("{{host}}/users");
    await expect(marks).toHaveCount(1);
    await input.press("End");
    await input.pressSequentially("/123");
    await expect(input).toHaveValue("{{host}}/users/123");
    await expect(page.getByLabel("Raw value")).toHaveText("{{host}}/users/123");
    await input.fill("{{host}}/" + "long-path/".repeat(30) + "{{zero}}");
    await input.press("End");
    await expect
      .poll(() =>
        input.evaluate((element) => element.scrollLeft + element.scrollTop),
      )
      .toBeGreaterThan(0);
    await expect(marks).toHaveCount(2);
  });
}

test("completion shows effective values and includes collection variables", async ({
  page,
}) => {
  await page.goto("/?variableInput");
  const input = page.getByPlaceholder("Request value");
  await input.fill("");
  await input.pressSequentially("{{");
  await expect(
    page.getByText("https://first.example", { exact: true }),
  ).toBeVisible();
  await input.press("ArrowDown");
  await expect(
    page.getByText("collection zero", { exact: true }),
  ).toBeVisible();
  await input.press("ArrowDown");
  await expect(
    page.getByText("collection value", { exact: true }),
  ).toBeVisible();
  await input.press("Enter");
  await expect(input).toHaveValue("{{collectionOnly}}");
});

test("body editor highlights variables and previews their actual values", async ({
  page,
}) => {
  await page.goto("/?variableInput&code");
  const variable = page.locator(".cm-request-variable");
  await expect(variable).toHaveText("{{host}}");
  await variable.hover();
  await expect(page.locator(".cm-tooltip")).toContainText(
    "https://first.example",
  );
});

test("variable previews include collection scope with environment and global overrides", async ({
  page,
}) => {
  await page.goto("/?variableInput");
  const input = page.getByPlaceholder("Request value");
  await input.fill("{{collectionOnly}}/{{host}}/{{zero}}/{{disabled}}");
  await input.hover();
  const tip = page.getByRole("tooltip");
  await expect(tip).toContainText("collection value");
  await expect(tip).toContainText("https://first.example");
  await expect(tip.getByText("collection zero", { exact: true })).toBeVisible();
  await expect(tip).not.toContainText("https://collection.example");
  await expect(tip).not.toContainText("Not the value");
  await expect(tip).toContainText("Undefined");
  await expect(tip).not.toContainText("hidden");
});

test("reference picker shares effective scopes with input previews", async ({
  page,
}) => {
  await page.goto("/?variableInput&quote");
  await expect(page.getByText("host", { exact: true })).toHaveCount(2);
  await expect(
    page.getByText("https://first.example", { exact: true }),
  ).toBeVisible();
  await page.getByText("collectionOnly", { exact: true }).click();
  await expect(
    page.getByText("collection value", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Collection", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Request value")).toHaveValue(
    "{{collectionOnly}}",
  );
  await expect(page.getByText("disabled", { exact: true })).toHaveCount(0);
});

test("previews distinguish empty, zero and dynamic values", async ({
  page,
}) => {
  await page.goto("/?variableInput");
  const input = page.getByPlaceholder("Request value");
  await input.fill("{{plainZero}}/{{empty}}/{{$timestamp}}");
  await input.hover();
  const tip = page.getByRole("tooltip");
  await expect(tip).toContainText("Configured value");
  await expect(tip.getByText("0", { exact: true })).toBeVisible();
  await expect(tip).toContainText("Empty string");
  await expect(tip).toContainText("Generated when the request is sent");
});
