import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";

async function fixture({ prepare, save } = {}) {
  const messages = [];
  let disposed = false;
  const panel = {
    webview: { postMessage: (message) => messages.push(message) },
    dispose: () => {
      disposed = true;
    },
  };
  const { handelExportDataMessage } = await load(
    "apps/extension/src/features/export/export-data-handler.ts",
    (id) => {
      if (id === "../../app/config")
        return { globalConfig: { exportDataWebView: panel } };
      if (id === "./export-data")
        return {
          getExportData:
            prepare ||
            (async () => ({ fileName: "requests.json", fileText: "{}" })),
        };
      if (id === "../../platform/host-utils")
        return {
          saveTextFile:
            save ||
            (async (_name, _text, onWrite) => {
              onWrite();
              return "/tmp/requests.json";
            }),
        };
      if (id === "vscode") return { window: { showInformationMessage() {} } };
      return nativeDependency(id);
    },
  );
  return {
    messages,
    disposed: () => disposed,
    run: () =>
      handelExportDataMessage(
        {
          action: "exportProjectData",
          requestId: "export-1",
          data: { type: "onapi" },
        },
        {},
        {},
      ),
  };
}

test("export stays pending through the save dialog and acknowledges the actual write", async () => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const f = await fixture({
    save: async (_name, _text, onWrite) => {
      await gate;
      onWrite();
      return "/tmp/requests.json";
    },
  });
  const operation = f.run();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(
    f.messages.map((message) => message.data.stage),
    ["preparing", "choosingLocation"],
  );
  assert.equal(f.disposed(), false);
  release();
  await operation;
  assert.deepEqual(
    f.messages.map((message) => message.data.stage),
    ["preparing", "choosingLocation", "saving", "complete"],
  );
  assert.ok(f.messages.every((message) => message.requestId === "export-1"));
  assert.equal(f.disposed(), true);
});

for (const failure of ["cancel", "prepare", "write"]) {
  test(`export ${failure} retains the panel and reports a terminal status`, async () => {
    const f = await fixture({
      ...(failure === "cancel" ? { save: async () => undefined } : {}),
      ...(failure === "prepare"
        ? {
            prepare: async () => {
              throw new Error("Invalid collection");
            },
          }
        : {}),
      ...(failure === "write"
        ? {
            save: async () => {
              throw new Error("Permission denied");
            },
          }
        : {}),
    });
    await f.run();
    assert.equal(f.disposed(), false);
    assert.equal(
      f.messages.at(-1).data.stage,
      failure === "cancel" ? "cancelled" : "error",
    );
    if (failure !== "cancel") assert.ok(f.messages.at(-1).data.error);
    assert.equal(
      f.messages.some((message) => message.data.stage === "complete"),
      false,
    );
  });
}

test("saving text distinguishes cancellation from write failure", async () => {
  let uri;
  let shouldFail = false;
  let writes = 0;
  const { saveTextFile } = await load(
    "apps/extension/src/platform/host-utils.ts",
    (id) => {
      if (id === "vscode")
        return {
          Uri: { file: (path) => path },
          window: { showSaveDialog: async () => uri },
        };
      if (id === "fs")
        return {
          writeFileSync: () => {
            writes++;
            if (shouldFail) throw new Error("Disk full");
          },
        };
      return nativeDependency(id);
    },
  );
  assert.equal(await saveTextFile("requests.json", "{}"), undefined);
  assert.equal(writes, 0);
  uri = { fsPath: "/tmp/requests.json" };
  assert.equal(await saveTextFile("requests.json", "{}"), uri.fsPath);
  shouldFail = true;
  await assert.rejects(saveTextFile("requests.json", "{}"), /Disk full/);
});
