import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
const bundle = await build({
  entryPoints: ["packages/api-converter/src/index.ts"],
  bundle: true,
  write: false,
  platform: "neutral",
  format: "esm",
});
const api = await import(
  "data:text/javascript;base64," +
    Buffer.from(bundle.outputFiles[0].text).toString("base64")
);
const fixture = () => ({
  info: {
    name: "Shop",
    schema:
      "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  auth: { type: "bearer", bearer: [{ key: "token", value: "{{token}}" }] },
  variable: [{ key: "base", value: "https://example.com" }],
  item: [
    {
      name: "Users",
      item: [
        {
          name: "Create",
          request: {
            method: "POST",
            url: {
              raw: "{{base}}/users/:id?q=one",
              query: [
                { key: "q", value: "one" },
                { key: "off", value: "two", disabled: true },
              ],
              variable: [{ key: "id", value: "123" }],
            },
            header: [{ key: "X-Test", value: "yes" }],
            body: {
              mode: "raw",
              raw: '{"name":"A"}',
              options: { raw: { language: "json" } },
            },
          },
          response: [
            {
              name: "Created",
              code: 201,
              header: [{ key: "Content-Type", value: "application/json" }],
              body: '{"id":123}',
            },
          ],
        },
      ],
    },
  ],
});
const openapi = () => ({
  openapi: "3.0.3",
  info: { title: "Shop" },
  servers: [{ url: "https://example.com/v1" }],
  components: {
    schemas: {
      User: {
        type: "object",
        properties: { child: { $ref: "#/components/schemas/User" } },
      },
    },
    parameters: {
      Id: {
        in: "path",
        name: "id",
        required: true,
        schema: { type: "string" },
      },
    },
    securitySchemes: { token: { type: "http", scheme: "bearer" } },
  },
  security: [{ token: [] }],
  paths: {
    "/users/{id}": {
      parameters: [
        { $ref: "#/components/parameters/Id" },
        { name: "q", in: "query", schema: { type: "string" }, example: "old" },
      ],
      post: {
        tags: ["Users"],
        parameters: [
          {
            name: "q",
            in: "query",
            schema: { type: "string" },
            example: "new",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/User" },
              example: { child: {} },
            },
          },
        },
        responses: {
          201: {
            description: "Created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
                examples: {
                  one: { value: { id: 1 } },
                  two: { value: { id: 2 } },
                },
              },
            },
          },
        },
      },
    },
  },
});

test("Postman round trip preserves nested folders, variables, auth, disabled parameters, raw bodies and examples", () => {
  const source = fixture();
  const original = structuredClone(source);
  const collection = api.readPostman(source).data;
  const output = api.writePostman(collection).data;
  assert.deepEqual(source, original);
  assert.equal(output.item[0].name, "Users");
  const r = output.item[0].item[0];
  assert.equal(r.request.body.raw, '{"name":"A"}');
  assert.equal(r.request.url.query[1].disabled, true);
  assert.equal(r.request.url.variable[0].value, "123");
  assert.equal(r.response[0].code, 201);
  assert.equal(output.auth.bearer[0].value, "{{token}}");
  assert.equal(output.variable[0].value, "https://example.com");
});
test("Postman 2.0 accepts string URLs and string requests; rejects invalid collections and unsupported versions", () => {
  const source = fixture();
  source.info.schema = source.info.schema.replace("v2.1.0", "v2.0.0");
  source.item = [{ name: "Get", request: "https://example.com?a=1&a=2" }];
  const r = api.readPostman(source).data.items[0].request;
  assert.equal(r.query.length, 2);
  assert.throws(() => api.readPostman({}), /Invalid/);
  source.info.schema = source.info.schema.replace("v2.0.0", "v1.0.0");
  assert.throws(() => api.readPostman(source), /supported/);
});
test("Postman form-data retains files and reports scripts and unsupported bodies", () => {
  const source = fixture();
  source.event = [{}];
  const item = source.item[0].item[0];
  item.request.body = {
    mode: "formdata",
    formdata: [{ key: "upload", type: "file", src: "file.txt" }],
  };
  item.event = [{}];
  const result = api.readPostman(source);
  assert.equal(result.warnings.length, 2);
  const body = api.writePostman(result.data).data.item[0].item[0].request.body;
  assert.equal(body.formdata[0].src, "file.txt");
});
test("Thunder import preserves nested folders, auth, body and disabled headers", () => {
  const result = api.readThunder({
    collectionName: "Thunder",
    folders: [
      { _id: "b", name: "B", containerId: "a" },
      { _id: "a", name: "A" },
    ],
    requests: [
      {
        name: "Send",
        containerId: "b",
        url: "https://example.com",
        method: "POST",
        headers: [{ name: "off", value: "x", isDisabled: true }],
        auth: { type: "bearer", bearer: "token" },
        body: { type: "json", raw: "{}" },
      },
    ],
  });
  const r = result.data.items[0].children[0].children[0].request;
  assert.equal(r.auth.values.token, "token");
  assert.equal(r.body.raw, "{}");
  assert.equal(r.headers[0].enabled, false);
  assert.throws(() => api.readThunder({}), /Invalid/);
  assert.throws(
    () =>
      api.readThunder({
        folders: [
          { _id: "a", containerId: "b" },
          { _id: "b", containerId: "a" },
        ],
        requests: [],
      }),
    /Cyclic/,
  );
});
test("OpenAPI resolves parameter references, operation overrides, auth, examples and cyclic schemas without mutating input", () => {
  const source = openapi();
  const original = structuredClone(source);
  const collection = api.readOpenApi(source).data;
  const r = collection.items[0].children[0].request;
  assert.deepEqual(source, original);
  assert.equal(r.url, "https://example.com/v1/users/{id}");
  assert.equal(r.query[0].value, "new");
  assert.equal(r.path[0].name, "id");
  assert.equal(r.auth.type, "bearer");
  assert.equal(r.responses.length, 2);
  const schema = r.body.schema;
  const key = "components/schemas/User";
  assert.equal(schema.$defs[key].properties.child.$ref, schema.$ref);
  const output = api.writeOpenApi(collection).data;
  assert.ok(Object.keys(output.components.schemas).length > 0);
  assert.doesNotThrow(() => api.readOpenApi(output));
});
test("OpenAPI honors host/basePath choices independently", () => {
  for (const [options, expected] of [
    [{ host: false, basePath: false }, "/users/{id}"],
    [{ host: true, basePath: false }, "https://example.com/users/{id}"],
    [{ host: false, basePath: true }, "/v1/users/{id}"],
  ])
    assert.equal(
      api.readOpenApi(openapi(), options).data.items[0].children[0].request.url,
      expected,
    );
});
test("OpenAPI rejects unresolved/external references and unsupported versions", () => {
  const source = openapi();
  source.components.schemas.User.properties.child.$ref = "external.json#/User";
  assert.throws(() => api.readOpenApi(source), /External schema/);
  source.components.schemas.User.properties.child.$ref =
    "#/components/schemas/Missing";
  assert.throws(() => api.readOpenApi(source), /Unresolved schema/);
  assert.throws(
    () => api.readOpenApi({ openapi: "4.0.0", paths: {} }),
    /Supported versions/,
  );
  assert.throws(
    () => api.writeOpenApi(api.readPostman(fixture()).data, "4.0"),
    /Unsupported/,
  );
});
test("Swagger 2.0 imports body/form fields, responses and security and exports valid body location", () => {
  const source = {
    swagger: "2.0",
    info: { title: "Legacy" },
    host: "example.com",
    basePath: "/v1",
    schemes: ["http"],
    definitions: {
      Input: { type: "object", properties: { id: { type: "integer" } } },
    },
    securityDefinitions: { basic: { type: "basic" } },
    security: [{ basic: [] }],
    paths: {
      "/users": {
        post: {
          consumes: ["application/json"],
          parameters: [
            {
              name: "body",
              in: "body",
              schema: { $ref: "#/definitions/Input" },
            },
          ],
          responses: {
            200: { description: "OK", schema: { $ref: "#/definitions/Input" } },
          },
        },
      },
    },
  };
  const collection = api.readOpenApi(source).data;
  assert.equal(collection.items[0].request.auth.type, "basic");
  const result = api.writeOpenApi(collection, "2.0").data;
  assert.equal(result.swagger, "2.0");
  assert.equal(Object.values(result.paths)[0].post.parameters[0].in, "body");
  assert.doesNotThrow(() => api.readOpenApi(result));
});
test("Duplicate OpenAPI operations produce warnings instead of silently overwriting data", () => {
  const collection = api.readPostman(fixture()).data;
  const items = collection.items[0].children;
  items.push(structuredClone(items[0]));
  const result = api.writeOpenApi(collection);
  assert.ok(result.warnings.some((w) => w.code === "duplicate-operation"));
});

test("OpenAPI export does not duplicate the server base path on round trip", () => {
  for (const version of ["2.0", "3.0"]) {
    const collection = api.readOpenApi(openapi()).data;
    const output = api.writeOpenApi(collection, version).data;
    assert.ok(output.paths["/users/{id}"]);
    const next = api.readOpenApi(output).data.items[0].children[0].request;
    assert.equal(next.url, "https://example.com/v1/users/{id}");
  }
});
test("OpenAPI exports multipart fields and synthesizes required path parameters", () => {
  const collection = api.readPostman(fixture()).data;
  const r = collection.items[0].children[0].request;
  r.body = {
    mode: "form-data",
    parameters: [{ name: "file", value: "", file: true, required: true }],
  };
  const output = api.writeOpenApi(collection).data;
  const op = output.paths["/users/{id}"].post;
  assert.equal(op.parameters.find((p) => p.in === "path").required, true);
  assert.equal(
    op.requestBody.content["multipart/form-data"].schema.properties.file.format,
    "binary",
  );
});

test("Postman preserves reserved query characters and variable placeholders in raw URL", () => {
  const collection = api.readPostman(fixture()).data;
  collection.items[0].children[0].request.query = [
    { name: "q", value: "a&b=c" },
    { name: "token", value: "{{token}}" },
  ];
  const raw = api.writePostman(collection).data.item[0].item[0].request.url.raw;
  assert.ok(raw.endsWith("?q=a%26b%3Dc&token={{token}}"));
});
test("Postman structured URLs with string paths import without a raw URL", () => {
  const source = fixture();
  source.item[0].item[0].request.url = {
    protocol: "https",
    host: ["example", "com"],
    path: "users/1",
  };
  assert.equal(
    api.readPostman(source).data.items[0].children[0].request.url,
    "https://example.com/users/1",
  );
});
