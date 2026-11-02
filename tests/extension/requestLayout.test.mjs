import { test } from "node:test";
import assert from "node:assert/strict";
import load from "../helpers/loadTypeScript.mjs";
import { readFile } from "node:fs/promises";

async function setup(select) {
  let config = { tab_direction: 1, language: "en" };
  let command;
  let writes = 0;
  const messages = [[], []];
  const context = {
    subscriptions: [],
    globalState: {
      get: () => config,
      update: async (_, next) => {
        config = next;
        writes++;
      },
    },
  };
  const { registerRequestLayoutCommand } = await load(
    "apps/extension/src/features/requests/request-layout.ts",
    (id) => {
      if (id === "vscode")
        return {
          env: { language: "en" },
          commands: {
            registerCommand: (name, run) => {
              assert.equal(name, "onapi.request.changeLayout");
              command = run;
              return { dispose() {} };
            },
          },
          window: {
            showQuickPick: async (items) =>
              select(items, () => {
                config = { ...config, theme: "dark" };
              }),
          },
        };
      if (id === "@onapi/domain/constants/common")
        return { STATUS_CODE: { ENABLE: 1, DISABLE: -1 } };
      if (id.endsWith("app/config"))
        return {
          globalConfig: {
            openedPanels: Object.fromEntries(
              messages.map((out, i) => [
                i,
                { webview: { postMessage: (message) => out.push(message) } },
              ]),
            ),
          },
        };
      if (id.endsWith("request-panel-channel"))
        return {
          postRequestPanelResponse: (webview, message) =>
            webview.postMessage(message),
        };
      throw new Error(`Unexpected dependency: ${id}`);
    },
  );
  registerRequestLayoutCommand(context);
  return {
    run: () => command(),
    config: () => config,
    writes: () => writes,
    messages,
  };
}

test("layout command preserves current settings and broadcasts the saved preference", async () => {
  const app = await setup((items, update) => {
    update();
    return items[1];
  });
  await app.run();
  assert.equal(app.config().tab_direction, -1);
  assert.equal(app.config().theme, "dark");
  assert.equal(app.config().language, "en");
  assert.equal(app.writes(), 1);
  for (const messages of app.messages) {
    assert.equal(messages.length, 1);
    assert.equal(messages[0].action, "setSystemConfig");
    assert.equal(messages[0].data.tab_direction, -1);
  }
});

test("cancelling layout selection makes no changes", async () => {
  const app = await setup(() => undefined);
  await app.run();
  assert.equal(app.writes(), 0);
  assert.equal(app.config().tab_direction, 1);
  assert.ok(app.messages.every((messages) => messages.length === 0));
});

test("layout action is restricted to request editor title bars", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../../apps/extension/package.json", import.meta.url),
      "utf8",
    ),
  );
  const action = manifest.contributes.menus["editor/title"].find(
    (item) => item.command === "onapi.request.changeLayout",
  );
  assert.equal(action.when, "activeCustomEditorId == onapi.request");
  assert.ok(
    manifest.contributes.commands.some(
      (item) => item.command === action.command && item.icon,
    ),
  );
});
