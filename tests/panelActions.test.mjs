import { requestPanelStubs } from "./helpers/requestPanelStubs.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import load from "./helpers/loadTypeScript.mjs";

test("shared panel actions handle exports and reads without consuming feature messages", async () => {
  const messages = [],
    exports = [],
    downloads = [],
    opened = [];
  const row = { id: "request", name: "Example" };
  const config = { http: { environments: [] } };
  const { handlePanelAction } = await load(
    "apps/extension/src/platform/webviews/panel-actions.ts",
    (id) => {
      if (id === "vscode")
        return {
          env: { openExternal: (uri) => opened.push(uri) },
          Uri: { parse: (uri) => uri },
          workspace: { getConfiguration: () => ({ get: () => "dark" }) },
        };
      if (id.endsWith("/project-config"))
        return { getCurrentProjectConfig: () => config };
      if (id.endsWith("/request-storage")) return { getApiList: () => [row] };
      if (id.endsWith("/share-data"))
        return {
          getDocBaseUrl: () => "http://localhost:3000/api-docs",
          getOpenApi: async (request) => {
            exports.push(request);
            return { fileName: "example.json", openApiStr: "{}" };
          },
        };
      if (id.endsWith("/host-utils"))
        return { downloadFile: (...args) => downloads.push(args) };
      return requestPanelStubs[id] ?? {};
    },
  );
  const context = { globalState: { get: () => ({ language: "en" }) } };
  const panel = {
    webview: { postMessage: (message) => messages.push(message) },
  };
  assert.equal(
    await handlePanelAction({ action: "getProjectConfig" }, context, panel),
    true,
  );
  assert.equal(messages[0].data, config);
  await handlePanelAction(
    { action: "exportOpenApiById", data: { id: "request" } },
    context,
    panel,
  );
  assert.equal(exports[0], row);
  assert.deepEqual(downloads, [["example.json", "{}"]]);
  await handlePanelAction(
    { action: "exportOpenApiById", data: { id: "missing" } },
    context,
    panel,
  );
  assert.equal(exports.length, 1);
  await handlePanelAction(
    { action: "openNewWindow", data: { invalid: true } },
    context,
    panel,
  );
  assert.equal(opened.length, 0);
  assert.equal(
    await handlePanelAction(
      { action: "saveApiData", data: row },
      context,
      panel,
    ),
    false,
  );
});
