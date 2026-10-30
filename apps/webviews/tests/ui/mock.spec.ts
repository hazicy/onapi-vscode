import { test, expect } from "@playwright/test";
import { build, loadConfigFromFile } from "vite";

test("production Mock engine runs expressions and Schema rules in Chromium", async ({
  page,
}) => {
  test.setTimeout(60000);
  const loaded = await loadConfigFromFile(
    { command: "build", mode: "production" },
    "apps/webviews/vite.config.mts",
  );
  const config = loaded!.config;
  config.build!.rolldownOptions!.input = {
    fixture: "apps/webviews/tests/ui/MockEngineFixture.ts",
  };
  config.build!.rolldownOptions!.preserveEntrySignatures = "strict";
  config.build!.write = false;
  const result = await build({
    ...config,
    configFile: false,
    logLevel: "silent",
  });
  const bundles = Array.isArray(result) ? result : [result];
  const assets = new Map(
    bundles.flatMap((bundle) =>
      "output" in bundle
        ? bundle.output.map((file) => [file.fileName, file] as const)
        : [],
    ),
  );
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/mock-assets/**", async (route) => {
    const key = new URL(route.request().url()).pathname.replace(
      "/mock-assets/",
      "",
    );
    const file = assets.get(key);
    if (!file || file.type !== "chunk") {
      return route.abort();
    }
    await route.fulfill({ contentType: "text/javascript", body: file.code });
  });
  await page.route("**/mock-engine.html", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<script type="module">import * as api from '/mock-assets/fixture.js';window.mockApi=api;</script>`,
    }),
  );
  await page.goto("http://127.0.0.1:4180/mock-engine.html");
  await page.waitForFunction(() => !!(window as any).mockApi);
  const value = await page.evaluate(async () => {
    const { mockExp, MockSchema } = (window as any).mockApi;
    const schema = await new MockSchema().mock({
      type: "object",
      properties: {
        count: {
          type: "integer",
          mock: { mock: "{{'number.int' | faker: min: 7, max: 7}}" },
        },
        email: {
          type: "string",
          format: "email",
        },
        tags: {
          type: "array",
          minItems: 2,
          maxItems: 2,
          items: { type: "string" },
        },
      },
    });
    return {
      hash: mockExp("{{text|md5}}", { text: "abc" }),
      name: mockExp("{{'person.firstName' | faker}}", {}, "zh-cn"),
      id: mockExp("{{'string.idcard' | faker}}", {}),
      schema,
    };
  });
  expect(value.hash).toBe("900150983cd24fb0d6963f7d28e17f72");
  expect(value.name).not.toContain("{{");
  expect(value.id).toMatch(/^\d{17}[0-9X]$/);
  expect(value.schema.count).toBe(7);
  expect(value.schema.email).toMatch(/@/);
  expect(value.schema.tags).toHaveLength(2);
  expect(errors).toEqual([]);
});
