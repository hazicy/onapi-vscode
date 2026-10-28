import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";

for (const development of [false, true]) {
  test(`shared Webview setup preserves resource and bootstrap data (${development ? "development" : "packaged"})`, async () => {
    const panel = { webview: { asWebviewUri: (uri) => `webview:${uri}` } };
    const calls = [];
    let registeredFormatter;
    const { createFeaturePanel } = await load(
      "apps/extension/src/platform/webviews/create-panel.ts",
      (id) => {
        if (id === "vscode")
          return {
            window: {
              createWebviewPanel: (...args) => {
                calls.push(args);
                return panel;
              },
            },
            Uri: { file: (uri) => uri },
            ViewColumn: { One: 1 },
          };
        if (id === "./formatter")
          return {
            registerFormatter: (target) => {
              registeredFormatter = target;
            },
          };
        if (id === "./html")
          return {
            getHtmlForWebview: (...args) => {
              calls.push(args);
              return "<html>fixture</html>";
            },
          };
        if (id.endsWith("/config")) return { LOCAL_PORT: "8080" };
        return nativeDependency(id);
      },
      { process: { env: { ONAPI_DEV_SERVER: String(development) } } },
    );
    const data = { initialData: { apiData: { id: "request" } } };
    assert.equal(
      createFeaturePanel(
        { extensionPath: "/extension" },
        { viewType: "tagPanel", title: "Request", iconName: "http.svg" },
        { title: "Edited request", data, hydrate: true },
      ),
      panel,
    );
    assert.equal(registeredFormatter, panel);
    assert.equal(calls[0][1], "Edited request");
    assert.equal(
      calls[1][0],
      development
        ? "http://localhost:8080/src/app/webviews/TagPanel.tsx"
        : "webview:/extension/dist/webviews/tagPanel.js",
    );
    assert.equal(calls[1][1], "webview:/extension/dist/webviews");
    assert.equal(calls[1][2], data);
    assert.equal(calls[1][3], true);
    assert.equal(panel.iconPath, "/extension/dist/images/http.svg");
  });
}
