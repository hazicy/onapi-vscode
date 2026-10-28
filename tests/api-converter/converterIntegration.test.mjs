import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { validate } from "jsonschema";
const result = await build({
  entryPoints: ["packages/api-converter/src/export.ts"],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  plugins: [
    {
      name: "ids",
      setup(builder) {
        builder.onResolve({ filter: /^@\/shared\/utils\/dataTools$/ }, () => ({
          path: "ids",
          namespace: "ids",
        }));
        builder.onLoad({ filter: /.*/, namespace: "ids" }, () => ({
          contents: `let id = 0; export const snowflakeId = () => 'test-' + ++id;`,
        }));
      },
    },
  ],
});
const api = await import(
  "data:text/javascript;base64," +
    Buffer.from(result.outputFiles[0].text).toString("base64")
);
const schemaBundle = await build({
  entryPoints: [
    "apps/webviews/src/features/import/utils/postmanSchema/postman_schema2.1.ts",
  ],
  bundle: true,
  write: false,
  format: "esm",
});
const postmanSchema = (
  await import(
    "data:text/javascript;base64," +
      Buffer.from(schemaBundle.outputFiles[0].text).toString("base64")
  )
).default;
const postman = () => ({
  info: { name: "Demo" },
  variable: [{ key: "host", value: "https://example.com" }],
  auth: { type: "bearer", bearer: [{ key: "token", value: "secret" }] },
  item: [
    {
      name: "Folder",
      variable: [{ key: "scope", value: "nested" }],
      item: [
        {
          name: "Get",
          request: { method: "GET", url: "{{host}}/{{scope}}", auth: null },
          response: [{ name: "OK", code: 200, header: [], body: "{}" }],
        },
      ],
    },
  ],
});

test("real app import/export retains directory links, auth, collection variables, folder scope and defaults", async () => {
  const source = postman();
  const original = structuredClone(source);
  const imported = await api.importMethod.postmanToApipost(source, "project");
  assert.equal(imported.status, "success");
  assert.deepEqual(source, original);
  const [folder, request] = imported.data.apis;
  assert.equal(request.parentId, folder.id);
  assert.equal(request.project_id, "project");
  assert.equal(request.request.auth, null);
  assert.equal(request.request.url, "{{host}}/{{scope}}");
  assert.equal(
    imported.data.http.collection.variable[0].value,
    "https://example.com",
  );
  const exported = await api.exportMethod.apiToPostman(imported.data);
  assert.equal(exported.status, "success");
  assert.equal(exported.data.auth.bearer[0].value, "secret");
  const validation = validate(exported.data, postmanSchema);
  assert.equal(
    validation.valid,
    true,
    validation.errors.map((e) => e.stack).join("\n"),
  );
});
test("real Swagger app adapter preserves body schemas, auth and example data through completion", async () => {
  const result = await api.importMethod.swaggerToApipost(
    {
      openapi: "3.0.3",
      info: { title: "Test" },
      components: {
        securitySchemes: { basic: { type: "http", scheme: "basic" } },
      },
      security: [{ basic: [] }],
      paths: {
        "/test": {
          post: {
            requestBody: {
              content: {
                "application/json": {
                  schema: { type: "object" },
                  example: { test: true },
                },
              },
            },
            responses: {
              201: {
                description: "Created",
                content: { "application/json": { example: { id: 1 } } },
              },
            },
          },
        },
      },
    },
    null,
  );
  assert.equal(result.status, "success");
  const request = result.data.apis[0];
  assert.equal(request.request.auth.type, "basic");
  assert.equal(request.request.body.raw, '{"test":true}');
  assert.equal(request.response[0].code, 201);
  assert.equal(request.response[0].body, '{"id":1}');
});
test("conversion failures keep the existing status/message contract", async () => {
  for (const r of await Promise.all([
    api.importMethod.postmanToApipost({}, ""),
    api.importMethod.thunderToApipost({}, ""),
    api.importMethod.swaggerToApipost({}, null),
    api.exportMethod.apiToSwagger({ apis: [] }, "4.0"),
  ])) {
    assert.equal(r.status, "error");
    assert.ok(r.message);
  }
});
test("export detects cyclic application folders instead of dropping all requests", async () => {
  const result = await api.exportMethod.apiToPostman({
    apis: [
      { id: "a", parentId: "b", kind: "folder" },
      { id: "b", parentId: "a", kind: "folder" },
    ],
  });
  assert.equal(result.status, "error");
  assert.match(result.message, /hierarchy/i);
});
