import { test } from "node:test";
import assert from "node:assert/strict";
import loadTypeScript from "../helpers/loadTypeScript.mjs";

async function fixture() {
  // The storage facade has no filesystem dependencies or fallback storage path.
  const api = await loadTypeScript(
    "apps/extension/src/platform/storage/index.ts",
    (id) => {
      throw new Error(`Unexpected dependency: ${id}`);
    },
  );
  return { api, context: {} };
}

test("storage requires an initialized repository and never falls back to old files", async () => {
  const { api, context } = await fixture();
  assert.throws(
    () => api.getDataFromGlobalStorage(context, "apiList", []),
    /not been initialized/,
  );
  assert.throws(
    () => api.hasStoredData(context, "apiList"),
    /not been initialized/,
  );
  assert.throws(() => api.getStorageFilePath(context), /not been initialized/);
  assert.equal(await api.setDataToGlobalStorage(context, "apiList", []), false);
});

test("all storage keys use the registered repository, including missing auxiliary data", async () => {
  const { api, context } = await fixture();
  const values = new Map();
  api.repositories.set(context, {
    root: { fsPath: "/global/.api-client" },
    has: (key) => values.has(key),
    get: (key, fallback) => values.get(key) ?? fallback,
    set: (key, value) => {
      values.set(key, value);
      return true;
    },
  });
  assert.equal(api.getStorageFilePath(context), "/global/.api-client");
  for (const key of ["apiList", "projectConfig_-1_-1", "-1:test"]) {
    assert.equal(api.hasStoredData(context, key), false);
    assert.deepEqual(api.getDataFromGlobalStorage(context, key, []), []);
    assert.equal(
      await api.setDataToGlobalStorage(context, key, { saved: true }),
      true,
    );
    assert.equal(api.hasStoredData(context, key), true);
    assert.deepEqual(api.getDataFromGlobalStorage(context, key), {
      saved: true,
    });
  }
});

test("repository serialization and validation errors report a failed save", async () => {
  const { api, context } = await fixture();
  api.repositories.set(context, {
    set: () => {
      throw new Error("Invalid data");
    },
  });
  assert.equal(
    await api.setDataToGlobalStorage(context, "apiList", undefined),
    false,
  );
});

test("storage preserves write failure diagnostics and clears them after a successful save", async () => {
  const { api, context } = await fixture();
  api.repositories.set(context, {
    set: async () => {
      throw new Error("Unsupported request kind: ai");
    },
  });
  assert.equal(await api.setDataToGlobalStorage(context, "apiList", []), false);
  assert.match(api.getStorageError(context), /Unsupported request kind: ai/);
  api.repositories.set(context, { set: async () => true });
  assert.equal(await api.setDataToGlobalStorage(context, "apiList", []), true);
  assert.equal(api.getStorageError(context), undefined);
});
