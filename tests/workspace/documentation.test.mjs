import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { readFile, mkdtemp, mkdir, copyFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

test("documentation JavaScript is served from packaged resources with an executable MIME type", async () => {
  const result = await build({
    entryPoints: ["apps/extension/src/features/documentation/index.ts"],
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    plugins: [
      {
        name: "documentation-dependencies",
        setup(builder) {
          builder.onResolve(
            {
              filter:
                /^vscode$|share-data$|(?:project-config|request-storage|report-storage|collection-order|import-curl|prepare-options|html|host-utils|user-config)$|^@onapi\/api-converter\/export$/,
            },
            (args) => ({ path: args.path, namespace: "stub" }),
          );
          builder.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
            contents: `export const completeOpenApiData = () => ({}); export const getExportData = () => ({}); export const getProjectShareData = () => ({ sample: {id: "sample"} }); export const setApiDocsBaseUrl = () => {}; export const getApiList = () => [{id: "sample", kind: "api", name: "Sample"}]; export const getLocalIPv4 = () => '127.0.0.1'; export const exportMethod = { apiToSwagger: async () => ({ status: "success", data: { openapi: "3.0.3", info: { title: "Onapi Scalar Preview", version: "1.0.0" }, paths: { "/users": { get: { summary: "List users", responses: { "200": { description: "Success" } } } } } } }) };`,
          }));
        },
      },
    ],
  });
  // Execute from a synthetic location: resources must follow extensionPath,
  // regardless of where the module was bundled or loaded from.
  const { createRequire } = await import("node:module");
  const module = { exports: {} };
  new Function("require", "module", "exports", result.outputFiles[0].text)(
    createRequire(import.meta.url),
    module,
    module.exports,
  );
  const extensionPath = await mkdtemp(path.join(tmpdir(), "onapi-docs-"));
  await mkdir(path.join(extensionPath, "dist"));
  await copyFile(
    fileURLToPath(
      new URL("../../apps/webviews/public/scalar.standalone.js", import.meta.url),
    ),
    path.join(extensionPath, "dist/scalar.standalone.js"),
  );
  const app = module.exports.createDocsApp({ extensionPath });
  const server = app.listen(0, "127.0.0.1");
  try {
    await once(server, "listening");
    const page = await fetch(
      `http://127.0.0.1:${server.address().port}/api-docs?share_id=sample`,
    );
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /Scalar\.createApiReference/);
    assert.match(html, /\/swagger\.json\?share_id=sample/);
    assert.doesNotMatch(html, /<redoc|cdn\.jsdelivr/);
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/doc.js`,
    );
    assert.equal(response.status, 200);
    assert.match(
      response.headers.get("content-type"),
      /application\/javascript/,
    );
    const script = await response.text();
    assert.equal(
      script,
      await readFile(`${extensionPath}/dist/scalar.standalone.js`, "utf8"),
    );
    assert.ok(script.length > 100000);
    assert.doesNotMatch(script.slice(0, 100), /<!doctype|<html/i);
    if (process.env.ONAPI_TEST_DOCUMENTATION_BROWSER === "true") {
      const { chromium } = await import("@playwright/test");
      const browser = await chromium.launch();
      try {
        const browserPage = await browser.newPage();
        const errors = [];
        const externalRequests = [];
        browserPage.on("pageerror", (error) => errors.push(error.message));
        await browserPage.route("**/*", (route) => {
          if (new URL(route.request().url()).hostname !== "127.0.0.1") {
            externalRequests.push(route.request().url());
            return route.abort();
          }
          return route.continue();
        });
        await browserPage.goto(
          `http://127.0.0.1:${server.address().port}/api-docs?share_id=sample`,
        );
        await browserPage
          .getByRole("heading", { name: "Onapi Scalar Preview", exact: true })
          .waitFor();
        await browserPage
          .getByRole("heading", { name: "List users", exact: true })
          .waitFor();
        assert.equal(
          await browserPage
            .getByText("Powered by Scalar", { exact: true })
            .isVisible(),
          false,
        );
        assert.equal(
          await browserPage
            .getByRole("button", { name: /Open API Client/i })
            .count(),
          0,
        );
        assert.deepEqual(errors, []);
        assert.deepEqual(externalRequests, []);
      } finally {
        await browser.close();
      }
    }
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await rm(extensionPath, { recursive: true, force: true });
  }
});
