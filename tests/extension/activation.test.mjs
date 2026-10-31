import { unexpectedCall as unused } from "../helpers/unexpectedCall.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";

for (const failAt of ["storage", "initialization"]) {
  test(`sidebar and recovery commands register when ${failAt} fails`, async () => {
    const calls = [],
      commands = new Map();
    const { activate, deactivate } = await load(
      "apps/extension/src/extension.ts",
      (id) => {
        if (id === "vscode")
          return {
            env: { language: "en" },
            window: {
              showErrorMessage: async (message) => {
                calls.push(["error", message]);
              },
            },
            commands: {
              registerCommand: (name, callback) => {
                commands.set(name, callback);
                return { dispose() {} };
              },
            },
            workspace: {
              getConfiguration: () => ({ get: (_, fallback) => fallback }),
              onDidChangeConfiguration: () => ({ dispose() {} }),
            },
          };
        if (id.endsWith("/repository"))
          return {
            JsonRepository: class {
              error =
                failAt === "storage"
                  ? "Unsupported storage version: 1"
                  : undefined;
              async flush() {
                calls.push(["flush-storage"]);
              }
              async start() {
                calls.push(["storage"]);
              }
            },
          };
        if (id === "./features/requests/request-autosave")
          return {
            flushAllRequestAutosaves: async () => {
              calls.push(["flush-autosave"]);
            },
          };
        if (id.endsWith("/register"))
          return { registerSidebarTree: () => calls.push(["views"]) };
        if (id.endsWith("/initialize"))
          return {
            initializePlugin: async () => {
              calls.push(["initialize"]);
              throw new Error("Seed failed");
            },
          };
        if (id.endsWith("/documentation"))
          return {
            startDocsServer: () => calls.push(["docs"]),
            restartServer: unused,
          };
        if (id === "./platform/webviews/panel-manager")
          return {
            createOpenPanel: unused,
            createImportDataPanel: unused,
            createEnvironmentPanel: unused,
            createFolderTestPanel: unused,
            createfolderTestReportDataPanel: unused,
            createExportDataPanel: unused,
          };
        if (id === "./platform/theme")
          return { onThemeChange: unused, onFontSizeChange: unused };
        if (id === "./features/sharing/share-list-panel")
          return { createShareListPanel: unused };
        if (id === "./features/sidebar/sidebar-handler")
          return { handleMessage: unused };
        if (id === "./platform/storage/events")
          return { storageChanged: { fire: unused } };
        if (id === "./app/config") return { globalConfig: {} };
        if (id === "./platform/storage/project-config")
          return { getCurrentProjectConfig: unused };
        if (id === "./features/requests/request-storage")
          return { getApiList: unused };
        if (id === "./platform/locale/index") return {};
        return nativeDependency(id);
      },
    );
    await activate({ subscriptions: [] });
    assert.ok(calls.some(([name]) => name === "views"));
    assert.ok(commands.has("onapi.storage.recover"));
    assert.ok(commands.has("openTabPanel"));
    assert.ok(calls.some(([name]) => name === "error"));
    await deactivate();
    assert.deepEqual(calls.slice(-2), [["flush-autosave"], ["flush-storage"]]);
    if (failAt === "storage")
      assert.ok(!calls.some(([name]) => name === "initialize"));
    else
      assert.ok(
        calls.findIndex(([name]) => name === "views") <
          calls.findIndex(([name]) => name === "initialize"),
      );
  });
}
