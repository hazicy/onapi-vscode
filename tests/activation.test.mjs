import { test } from "node:test";
import assert from "node:assert/strict";
import load from "./helpers/loadTypeScript.mjs";

for (const failAt of ["storage", "initialization"]) {
  test(`sidebar and recovery commands register when ${failAt} fails`, async () => {
    const calls = [],
      commands = new Map();
    const { activate } = await load("apps/extension/src/extension.ts", (id) => {
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
            async start() {
              calls.push(["storage"]);
            }
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
        return { startDocsServer: () => calls.push(["docs"]) };
      return {};
    });
    await activate({ subscriptions: [] });
    assert.ok(calls.some(([name]) => name === "views"));
    assert.ok(commands.has("onapi.storage.recover"));
    assert.ok(commands.has("openTabPanel"));
    assert.ok(calls.some(([name]) => name === "error"));
    if (failAt === "storage")
      assert.ok(!calls.some(([name]) => name === "initialize"));
    else
      assert.ok(
        calls.findIndex(([name]) => name === "views") <
          calls.findIndex(([name]) => name === "initialize"),
      );
  });
}
