import { test } from "node:test";
import assert from "node:assert/strict";
import load from "../helpers/loadTypeScript.mjs";

async function fixture({
  method = "file",
  input,
  source,
  cancel = false,
  switchProject = false,
} = {}) {
  const previews = [],
    curls = [],
    errors = [],
    calls = [];
  let project = "one";
  const types = {
    CURL: "curl",
    SWAGGERURL: "swaggerUrl",
    POSTMAN: "postman",
    SWAGGER: "swagger",
    ONAPI: "onapi",
    THUNDER_CLIENT: "thunder",
  };
  const module = await load(
    "apps/extension/src/features/import/import-source.ts",
    (id) => {
      if (id === "vscode")
        return {
          ProgressLocation: { Notification: 1 },
          window: {
            showQuickPick: async () => (cancel ? undefined : { method }),
            showOpenDialog: async () => {
              calls.push("file");
              return [{ path: "/collection.json" }];
            },
            showInputBox: async () => {
              calls.push("input");
              return input;
            },
            withProgress: async (_, run) => run(),
            showErrorMessage: (message) => errors.push(message),
          },
          workspace: { fs: { readFile: async () => Buffer.from(source) } },
        };
      if (id === "i18next") return { t: (key) => key };
      if (id === "axios") return { get: async () => ({ data: source }) };
      if (id.includes("settings/constants")) return { IMPORT_TYPE_ENUM: types };
      if (id.endsWith("project-config"))
        return { getCurrentProjectId: () => project };
      if (id.endsWith("import-data-handler"))
        return {
          parseImportSource: async () => {
            if (switchProject) project = "two";
            return { apis: [{ id: "request" }], envs: [], models: [] };
          },
        };
      if (id.endsWith("import-curl"))
        return { curlImport: async (value) => curls.push(value) };
      throw new Error(id);
    },
    { URL, Buffer },
  );
  await module.collectImportSource(undefined, {}, (preview) =>
    previews.push(preview),
  );
  return { previews, curls, errors, calls };
}

test("file picker parses a collection before opening its preview", async () => {
  const result = await fixture({ source: '\uFEFF{"info":{},"item":[]}' });
  assert.deepEqual(result.calls, ["file"]);
  assert.equal(result.previews[0].fileType, "postman");
  assert.equal(result.previews[0].projectId, "one");
  assert.equal(result.previews[0].name, "collection.json");
});

test("link input opens a parsed OpenAPI preview", async () => {
  const result = await fixture({
    method: "url",
    input: "https://example.test/schema",
    source: '{"openapi":"3.0.0"}',
  });
  assert.deepEqual(result.calls, ["input"]);
  assert.equal(result.previews[0].fileType, "swagger");
});

test("cURL input opens a request without a selection preview", async () => {
  const result = await fixture({
    method: "curl",
    input: "curl https://example.test",
  });
  assert.deepEqual(result.curls, ["curl https://example.test"]);
  assert.equal(result.previews.length, 0);
});

test("cancelled source selection has no side effects", async () => {
  const result = await fixture({ cancel: true });
  assert.equal(
    result.previews.length +
      result.curls.length +
      result.calls.length +
      result.errors.length,
    0,
  );
});

test("invalid files and project changes do not open previews", async () => {
  for (const options of [
    { source: "invalid" },
    { source: "{}" },
    { source: '{"openapi":"3.0.0"}', switchProject: true },
  ]) {
    const result = await fixture(options);
    assert.equal(result.previews.length, 0);
    assert.equal(result.errors.length, 1);
  }
});
