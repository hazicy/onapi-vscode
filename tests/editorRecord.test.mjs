import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "./helpers/loadTypeScript.mjs";

const domain = await load(
  "packages/domain/src/requests/record.ts",
  nativeDependency,
);
const contracts = await load(
  "packages/contracts/src/request-panel/index.ts",
  nativeDependency,
);
const plain = (value) => JSON.parse(JSON.stringify(value));
const base = {
  id: "request",
  parentId: "0",
  name: "Draft",
  kind: "api",
  request: { method: "GET", url: "" },
};

for (const kind of ["api", "graphql", "sse"]) {
  test(`${kind} domain and wire records share validated data without filling metadata defaults`, () => {
    const record = {
      ...base,
      kind,
      request: {
        method: "POST",
        url: {
          raw: "{{baseUrl}}/users",
          host: ["{{baseUrl}}"],
          customUrl: true,
        },
        header: [
          { key: "Accept", value: "application/json", customHeader: "keep" },
        ],
        auth: {
          type: "bearer",
          bearer: [{ key: "token", value: "{{token}}", customAuth: false }],
        },
        body: {
          mode: "graphql",
          graphql: { query: "query { user }", variables: "{}" },
          extraBody: { keep: true },
        },
      },
      event: [
        {
          listen: "test",
          script: {
            exec: ["pm.test('ok', () => {});"],
            packageMetadata: { keep: true },
          },
        },
      ],
      response: [
        { code: 200, responseTime: 12, body: "{}", customResponse: true },
      ],
      extension: { keep: true },
    };
    const parsed = domain.editorRecordSchema.parse(record);
    assert.deepEqual(plain(parsed), record);
    assert.equal("project_id" in parsed, false);
    assert.equal("sort" in parsed, false);
    const saved = {
      action: "requestSaved",
      requestId: "save",
      data: { definition: record, submitted: record },
    };
    assert.deepEqual(
      plain(contracts.requestPanelResponseSchema.parse(saved)),
      saved,
    );
  });
}

test("invalid executable fields cannot enter the editor through commands or saved acknowledgements", () => {
  const mutations = [
    { ...base, request: null },
    { ...base, request: { url: 123 } },
    { ...base, request: { url: "", header: [{ key: "A", value: 42 }] } },
    {
      ...base,
      request: { url: "", auth: { type: "bearer", bearer: "token" } },
    },
    { ...base, request: { url: "", body: { mode: "raw", raw: 123 } } },
    { ...base, event: [{ listen: "test", script: { exec: 42 } }] },
    { ...base, response: [{ code: "200", responseTime: 10 }] },
    { ...base, sort: "1" },
  ];
  for (const record of mutations) {
    assert.equal(domain.editorRecordSchema.safeParse(record).success, false);
    assert.equal(
      contracts.requestPanelCommandSchema.safeParse({
        action: "saveApiData",
        data: record,
      }).success,
      false,
    );
    assert.equal(
      contracts.requestPanelResponseSchema.safeParse({
        action: "requestSaved",
        data: { definition: record, submitted: base },
      }).success,
      false,
    );
  }
});

test("empty drafts and protocol-specific records preserve their distinct data shapes", () => {
  assert.deepEqual(plain(domain.editorRecordSchema.parse(base)), base);
  const example = { ...base, response: [{ code: 200, body: "{}" }] };
  assert.deepEqual(plain(domain.editorRecordSchema.parse(example)), example);
  for (const record of [
    {
      id: "folder",
      parentId: "0",
      name: "Folder",
      kind: "folder",
      variable: [{ key: "x", value: 1 }],
    },
    {
      id: "socket",
      parentId: "folder",
      name: "Socket",
      kind: "websocket",
      request: { header: { parameter: [] } },
      config: { reconnect_num: 3 },
    },
  ])
    assert.deepEqual(plain(domain.editorRecordSchema.parse(record)), record);
});

test("all authentication types exposed by the editor retain their native attributes", () => {
  for (const type of [
    "noauth",
    "basic",
    "bearer",
    "apikey",
    "digest",
    "oauth1",
    "oauth2",
    "hawk",
    "awsv4",
    "edgegrid",
    "ntlm",
    "jwt",
    "asap",
  ]) {
    const auth =
      type === "noauth"
        ? { type }
        : {
            type,
            [type]: [{ key: "value", value: { enabled: false, count: 0 } }],
          };
    const record = { ...base, request: { ...base.request, auth } };
    assert.deepEqual(plain(domain.editorRecordSchema.parse(record)), record);
  }
});
