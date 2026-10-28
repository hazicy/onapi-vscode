import { unexpectedCall as unused } from "../helpers/unexpectedCall.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import load from "../helpers/loadTypeScript.mjs";
import { nativeDependency } from "../helpers/loadTypeScript.mjs";
const versions = await load(
  "packages/domain/src/sync/utils/api-versions.ts",
  (id) => nativeDependency(id),
);
const plain = (value) => JSON.parse(JSON.stringify(value));
async function fixture({
  diskSucceeds = true,
  metadataSucceeds = true,
  duringRecord,
} = {}) {
  const calls = [];
  let key = "apiList:origin";
  let rows = [
    {
      id: "request",
      parentId: "folder",
      project_id: "origin",
      version: 1,
      name: "Edited during upload",
      request: { body: "new local body" },
    },
    { id: "new", version: 1, name: "Added during upload" },
  ];
  const panel = {
    dispose: () => calls.push(["dispose"]),
    webview: { postMessage: () => {} },
  };
  const config = {
    pushWebView: panel,
  };
  const context = {};
  const source = { panel, apiListName: key };
  const { handelPushMessage } = await load(
    "apps/extension/src/features/sync/push-handler.ts",
    (id) => {
      if (id === "../../app/config") return { globalConfig: config };
      if (id === "@onapi/domain/sync/utils/api-versions") return versions;
      if (
        /\/(?:project-config|request-storage|report-storage|collection-order|import-curl|prepare-options|html|host-utils|user-config)$/.test(
          id,
        )
      )
        return {
          getCurrentProjectConfig: unused,
          getApiListName: () => key,
          getApiList: () => {
            calls.push(["read"]);
            return structuredClone(rows);
          },
          setApiList: (list) => {
            calls.push(["write", plain(list)]);
            if (diskSucceeds) rows = plain(list);
            return diskSucceeds;
          },
          setProjectApisVersion: async (_, values) => {
            calls.push(["metadata", plain(values)]);
            if (duringRecord) await duringRecord(f);
            return metadataSucceeds;
          },
        };
      if (id === "vscode")
        return {
          window: {
            showInformationMessage: (message) =>
              calls.push(["success", message]),
            showErrorMessage: (message) => calls.push(["error", message]),
          },
        };
      throw new Error(`Unexpected dependency ${id}`);
    },
  );
  const f = {
    calls,
    config,
    rows: () => rows,
    replace: (values) => {
      rows = values;
    },
    switchWorkspace: () => {
      key = "apiList:other";
    },
    complete: (values = [{ id: "request", version: 2 }]) =>
      handelPushMessage(
        {
          action: "completePush",
          data: { project_id: "target", versions: values },
        },
        context,
        source,
      ),
  };
  return f;
}
test("push completion reads latest local data and only updates returned versions", async () => {
  const f = await fixture();
  await f.complete([
    { id: "request", version: 2 },
    { id: "deleted", version: 9 },
  ]);
  assert.equal(f.rows().length, 2);
  assert.equal(f.rows()[0].version, 2);
  assert.equal(f.rows()[0].name, "Edited during upload");
  assert.equal(f.rows()[0].parentId, "folder");
  assert.equal(f.rows()[0].project_id, "origin");
  assert.equal(f.rows()[0].request.body, "new local body");
  assert.equal(f.rows()[1].name, "Added during upload");
  assert.deepEqual(
    f.calls.map(([name]) => name),
    ["metadata", "read", "write", "dispose", "success"],
  );
  assert.equal(f.calls[0][1][0].project_id, "target");
});
test("edits and deletion during metadata persistence are respected without recreating requests", async () => {
  const f = await fixture({
    duringRecord: async (f) => {
      f.replace([{ id: "newer", version: 1 }]);
    },
  });
  await f.complete();
  assert.deepEqual(f.rows(), [{ id: "newer", version: 1 }]);
  assert.equal(
    f.calls.find(([name]) => name === "write"),
    undefined,
  );
});
for (const when of ["before", "during"]) {
  test(`workspace switch ${when} metadata persistence prevents local writes and success`, async () => {
    const f = await fixture({
      duringRecord:
        when === "during" ? async (f) => f.switchWorkspace() : undefined,
    });
    if (when === "before") f.switchWorkspace();
    await f.complete();
    assert.equal(
      f.calls.find(([name]) =>
        ["read", "write", "dispose", "success"].includes(name),
      ),
      undefined,
    );
  });
}
test("late completion from a replaced panel cannot close the new panel or write data", async () => {
  const f = await fixture();
  f.config.pushWebView = {
    dispose: () => {
      throw new Error("New panel closed");
    },
  };
  await f.complete();
  assert.deepEqual(f.calls, []);
});
for (const failure of ["disk", "metadata"]) {
  test(`${failure} failure keeps the panel open and reports partial save failure`, async () => {
    const f = await fixture({
      diskSucceeds: failure !== "disk",
      metadataSucceeds: failure !== "metadata",
    });
    await f.complete();
    assert.equal(f.rows()[0].version, 1);
    assert.equal(
      f.calls.find(([name]) => name === "dispose" || name === "success"),
      undefined,
    );
    assert.ok(f.calls.find(([name]) => name === "error"));
  });
}
test("environment-only completion closes without writing request data", async () => {
  const f = await fixture();
  await f.complete([]);
  assert.deepEqual(
    f.calls.map(([name]) => name),
    ["dispose", "success"],
  );
});
test("malformed returned versions do not silently report success", async () => {
  const f = await fixture();
  await f.complete([{ id: "request", version: "2" }]);
  assert.deepEqual(
    f.calls.map(([name]) => name),
    ["error"],
  );
});
test("version metadata persistence awaits storage and preserves existing state on failure", async () => {
  const original = { target: { existing: 1 } };
  const { setProjectApisVersion } = await load(
    "apps/extension/src/features/requests/request-storage.ts",
    (id) =>
      id === "../../platform/storage/index"
        ? {
            getDataFromGlobalStorage: unused,
            setDataToGlobalStorage: unused,
            updateDataInGlobalStorage: unused,
          }
        : id === "vscode"
          ? {}
          : nativeDependency(id),
  );
  const context = {
    globalState: {
      get: () => original,
      update: async () => {
        throw new Error("Storage failed");
      },
    },
  };
  assert.equal(
    await setProjectApisVersion(context, [
      { id: "request", project_id: "target", version: 2 },
    ]),
    false,
  );
  assert.deepEqual(original, { target: { existing: 1 } });
});
