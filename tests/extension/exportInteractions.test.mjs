import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";

async function fixture({
  choices = ["onapi"],
  cancelSave = false,
  failure,
  switchProject = false,
} = {}) {
  const prepared = [],
    saved = [],
    notices = [],
    errors = [],
    picks = [];
  let project = "one";
  const { exportProject } = await load(
    "apps/extension/src/features/export/export-flow.ts",
    (id) => {
      if (id === "vscode")
        return {
          ProgressLocation: { Notification: 1 },
          window: {
            showQuickPick: async (items) => {
              picks.push(items);
              const choice = choices.shift();
              if (!choice) return undefined;
              return items.find(
                (item) => item.type === choice || item.version === choice,
              );
            },
            withProgress: async (_, run) => run(),
            showInformationMessage: (message) => notices.push(message),
            showErrorMessage: (message) => errors.push(message),
          },
        };
      if (id === "i18next") return { t: (key) => key };
      if (id.endsWith("project-config"))
        return { getCurrentProjectId: () => project };
      if (id === "./export-data")
        return {
          getExportData: async (options) => {
            prepared.push(options);
            if (failure === "prepare") throw new Error("Conversion failed");
            if (switchProject) project = "two";
            return { fileName: "requests.json", fileText: "{}" };
          },
        };
      if (id.endsWith("host-utils"))
        return {
          saveTextFile: async (...args) => {
            saved.push(args);
            if (failure === "write") throw new Error("Disk full");
            return cancelSave ? undefined : "/tmp/requests.json";
          },
        };
      throw new Error(id);
    },
  );
  return {
    prepared,
    saved,
    notices,
    errors,
    picks,
    run: (options) => exportProject(options, {}),
  };
}

test("export chooses a format then saves without opening a webview", async () => {
  const f = await fixture({ choices: ["postman"] });
  await f.run();
  assert.equal(f.prepared[0].type, "postman");
  assert.deepEqual(f.saved, [["requests.json", "{}"]]);
  assert.equal(f.notices.length, 1);
});

test("OpenAPI export selects its version", async () => {
  const f = await fixture({ choices: ["swagger", "2.0"] });
  await f.run();
  assert.equal(f.prepared[0].version, "2.0");
  assert.equal(f.picks.length, 2);
});

test("explicit environment export skips format selection", async () => {
  const f = await fixture();
  await f.run({ type: "environment" });
  assert.equal(f.prepared[0].type, "environment");
  assert.equal(f.picks.length, 0);
});

for (const choices of [[], ["swagger"]]) {
  test(`cancelling selection after ${choices.length} steps does not prepare or save`, async () => {
    const f = await fixture({ choices: [...choices] });
    await f.run();
    assert.equal(
      f.prepared.length + f.saved.length + f.notices.length + f.errors.length,
      0,
    );
  });
}

test("cancelling save does not report success", async () => {
  const f = await fixture({ cancelSave: true });
  await f.run();
  assert.equal(f.saved.length, 1);
  assert.equal(f.notices.length + f.errors.length, 0);
});

for (const failure of ["prepare", "write"]) {
  test(`export reports ${failure} failures`, async () => {
    const f = await fixture({ failure });
    await f.run();
    assert.equal(f.errors.length, 1);
    assert.equal(f.notices.length, 0);
  });
}

test("project changes during conversion abort saving", async () => {
  const f = await fixture({ switchProject: true });
  await f.run();
  assert.equal(f.saved.length, 0);
  assert.equal(f.errors.length, 1);
});

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
