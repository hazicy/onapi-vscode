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
  const imported = await api.importMethod.fromPostman(source, "project");
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
  const exported = await api.exportMethod.toPostman(imported.data);
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
  const result = await api.importMethod.fromOpenApi(
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
    api.importMethod.fromPostman({}, ""),
    api.importMethod.fromThunder({}, ""),
    api.importMethod.fromOpenApi({}, null),
    api.exportMethod.toOpenApi({ apis: [] }, "4.0"),
  ])) {
    assert.equal(r.status, "error");
    assert.ok(r.message);
  }
});
test("export detects cyclic application folders instead of dropping all requests", async () => {
  const result = await api.exportMethod.toPostman({
    apis: [
      { id: "a", parentId: "b", kind: "folder" },
      { id: "b", parentId: "a", kind: "folder" },
    ],
  });
  assert.equal(result.status, "error");
  assert.match(result.message, /hierarchy/i);
});

test("native import/export preserves identities, nested and empty folders, scripts and request data", async () => {
  const source = {
    info: { name: "Nested requests" },
    item: [
      {
        id: "outer",
        name: "Outer",
        item: [
          { id: "empty", name: "Empty", item: [] },
          {
            id: "inner",
            name: "Inner",
            item: [
              {
                id: "request",
                name: "Create",
                event: [
                  {
                    listen: "test",
                    script: { exec: ["pm.test('ok', () => {});"] },
                  },
                ],
                request: {
                  method: "POST",
                  url: "https://example.test/users",
                  body: {
                    mode: "raw",
                    raw: '{"name":"Alice"}',
                    options: { raw: { language: "json" } },
                  },
                },
                response: [
                  {
                    name: "Created",
                    code: 201,
                    body: '{"id":1}',
                    header: [
                      { key: "Content-Type", value: "application/json" },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  const original = structuredClone(source);
  const imported = await api.importMethod.fromPostman(source, "project");
  assert.equal(imported.status, "success");
  assert.deepEqual(source, original);
  const rows = imported.data.apis;
  assert.deepEqual(
    rows.map(({ id, parentId, kind, project_id }) => ({
      id,
      parentId,
      kind,
      project_id,
    })),
    [
      { id: "outer", parentId: "0", kind: "folder", project_id: "project" },
      { id: "empty", parentId: "outer", kind: "folder", project_id: "project" },
      { id: "inner", parentId: "outer", kind: "folder", project_id: "project" },
      { id: "request", parentId: "inner", kind: "api", project_id: "project" },
    ],
  );
  const snapshot = structuredClone(imported.data);
  const exported = await api.exportMethod.toPostman(imported.data);
  assert.equal(exported.status, "success");
  assert.deepEqual(imported.data, snapshot);
  assert.deepEqual(exported.data.item, source.item);
  exported.data.item[0].item[1].item[0].response[0].body = "edited";
  assert.equal(rows[3].response[0].body, '{"id":1}');
  const next = await api.exportMethod.toPostman(imported.data);
  assert.equal(next.data.item[0].item[1].item[0].response[0].body, '{"id":1}');
});

test("OpenAPI app imports preserve examples without inserting legacy response defaults or sharing mutable data", async () => {
  const operation = {
    requestBody: {
      content: { "application/json": { example: { value: true } } },
    },
    responses: {
      201: {
        description: "Created",
        content: { "application/json": { example: { id: 1 } } },
      },
    },
  };
  const source = {
    openapi: "3.0.3",
    info: { title: "Independent requests" },
    components: {
      securitySchemes: { basic: { type: "http", scheme: "basic" } },
    },
    security: [{ basic: [] }],
    paths: {
      "/first": { post: operation },
      "/second": { post: structuredClone(operation) },
    },
  };
  const snapshot = structuredClone(source);
  const imported = await api.importMethod.fromOpenApi(source, null);
  assert.equal(imported.status, "success");
  assert.deepEqual(source, snapshot);
  const [first, second] = imported.data.apis;
  assert.equal(first.kind, "api");
  assert.equal(first.request.body.mode, "raw");
  assert.equal(first.request.body.raw, '{"value":true}');
  assert.deepEqual(
    first.response.map(({ code }) => code),
    [201],
  );
  const secondAuth = structuredClone(second.request.auth);
  first.request.auth.basic[0].value = "edited";
  first.response[0].body = "edited";
  assert.deepEqual(second.request.auth, secondAuth);
  assert.equal(second.response[0].body, '{"id":1}');
  const next = await api.importMethod.fromOpenApi(source, null);
  assert.deepEqual(
    next.data.apis[0].response.map(({ code }) => code),
    [201],
  );
  assert.equal(next.data.apis[0].response[0].body, '{"id":1}');
});

test("OpenAPI app imports retain server variables in native environments without fabricating missing values", async () => {
  const source = {
    openapi: "3.0.3",
    info: { title: "Environments" },
    servers: [
      {
        description: "Development",
        url: "https://example.test/{tenant}",
        variables: {
          tenant: { default: "dev" },
          token: { default: "{{API_TOKEN}}" },
        },
      },
      { description: "Empty", url: "https://other.test" },
    ],
    paths: { "/users": { get: { responses: { 200: { description: "OK" } } } } },
  };
  const snapshot = structuredClone(source);
  const imported = await api.importMethod.fromOpenApi(source, null);
  assert.equal(imported.status, "success");
  assert.deepEqual(source, snapshot);
  const [development, empty] = imported.data.http.environments;
  assert.equal(development.name, "Development");
  assert.deepEqual(development.values, [
    { key: "tenant", value: "dev", enabled: true },
    { key: "token", value: "{{API_TOKEN}}", enabled: true },
  ]);
  assert.equal(empty.name, "Empty");
  assert.deepEqual(empty.values, []);
  assert.notEqual(development.id, empty.id);
  assert.equal(
    imported.data.apis[0].request.url.raw,
    "https://example.test/dev/users",
  );
});
