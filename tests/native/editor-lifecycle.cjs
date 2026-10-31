const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const vscode = require("vscode");

async function until(predicate, label) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out: ${label}`);
}

exports.run = async () => {
  await vscode.extensions.getExtension("onapi.onapi").activate();
  const configuration = vscode.workspace.getConfiguration("files");
  await configuration.update(
    "autoSave",
    "off",
    vscode.ConfigurationTarget.Global,
  );
  const record = (id) => ({
    id,
    parentId: "0",
    kind: "api",
    name: "Native lifecycle",
    request: { method: "GET", url: "https://example.com/native" },
  });
  const tabFor = (id) =>
    vscode.window.tabGroups.all
      .flatMap((group) => group.tabs)
      .find(
        (tab) =>
          tab.input instanceof vscode.TabInputCustom &&
          tab.input.viewType === "onapi.request" &&
          tab.input.uri.path.endsWith(`/${id}`),
      );
  const storageFile = (id) =>
    path.join(
      process.env.ONAPI_TEST_USER_DATA,
      "User/globalStorage/onapi.onapi/.api-client/collections",
      `${id}.json`,
    );

  await vscode.commands.executeCommand("openTabPanel", record("native-undo"));
  await until(() => tabFor("native-undo")?.isDirty, "new request dirty");
  await vscode.commands.executeCommand("undo");
  await until(
    () => tabFor("native-undo") && !tabFor("native-undo").isDirty,
    "undo creation content",
  );
  await vscode.commands.executeCommand("redo");
  await until(() => tabFor("native-undo")?.isDirty, "redo creation content");
  const resource = tabFor("native-undo").input.uri;
  assert.ok(await vscode.workspace.save(resource));
  await until(() => !tabFor("native-undo").isDirty, "native save clean");
  await vscode.commands.executeCommand("undo");
  await until(() => tabFor("native-undo").isDirty, "undo after save");
  await vscode.commands.executeCommand("redo");
  await until(
    () => !tabFor("native-undo").isDirty,
    "redo returns to native save point",
  );
  const persisted = JSON.parse(
    await fs.readFile(storageFile("native-undo"), "utf8"),
  );
  assert.equal(persisted.request.url, record("native-undo").request.url);
  assert.ok(await vscode.window.tabGroups.close(tabFor("native-undo")));
  await vscode.commands.executeCommand("openTabPanel", {
    ...record("native-undo"),
    request: { method: "GET", url: "https://stale.invalid" },
  });
  await until(() => !!tabFor("native-undo"), "reopen saved request");
  assert.equal(tabFor("native-undo").isDirty, false);
  await vscode.workspace.save(tabFor("native-undo").input.uri);
  const reopened = JSON.parse(
    await fs.readFile(storageFile("native-undo"), "utf8"),
  );
  assert.equal(reopened.request.url, persisted.request.url);
  await vscode.window.tabGroups.close(tabFor("native-undo"));

  await configuration.update(
    "autoSaveDelay",
    100,
    vscode.ConfigurationTarget.Global,
  );
  await configuration.update(
    "autoSave",
    "afterDelay",
    vscode.ConfigurationTarget.Global,
  );
  await vscode.commands.executeCommand(
    "openTabPanel",
    record("native-autosave"),
  );
  await until(async () => {
    try {
      return (
        !!tabFor("native-autosave") &&
        !tabFor("native-autosave").isDirty &&
        !!(await fs.stat(storageFile("native-autosave")))
      );
    } catch {
      return false;
    }
  }, "native afterDelay auto save");
  await vscode.window.tabGroups.close(tabFor("native-autosave"));

  const exported = vscode.Uri.file(
    path.join(process.env.ONAPI_TEST_USER_DATA, "export.onapi.json"),
  );
  await vscode.workspace.fs.writeFile(
    exported,
    new TextEncoder().encode(JSON.stringify(record("native-export"))),
  );
  await vscode.commands.executeCommand("vscode.open", exported);
  await until(
    () =>
      vscode.window.tabGroups.all.some((group) =>
        group.tabs.some(
          (tab) =>
            tab.input instanceof vscode.TabInputCustom &&
            tab.input.uri.toString() === exported.toString(),
        ),
      ),
    "exported file resolves to request editor",
  );
  console.log(
    "Native editor lifecycle passed: undo/redo, save, reopen, auto save, exported file resolver.",
  );
};
