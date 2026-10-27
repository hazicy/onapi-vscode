import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { build } from "esbuild";

const result = await build({
  stdin: {
    contents: [
      "./apps/webviews/src/shared/components/RequestTable/sdk.ts",
      "./apps/webviews/src/features/requests/utils/executionView.ts",
      "./apps/webviews/src/features/requests/utils/graphql/graphql2json.ts",
      "./apps/webviews/src/features/requests/utils/graphql/json2graphql.ts",
      "./apps/webviews/src/features/requests/utils/graphql/schema2tree.ts",
    ]
      .map((file) => `export * from ${JSON.stringify(file)};`)
      .join("\n"),
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "cjs",
});
const module = { exports: {} };
new Function("require", "module", "exports", result.outputFiles[0].text)(
  createRequire(import.meta.url),
  module,
  module.exports,
);
const {
  sdkParameterToRow,
  rowToSdkParameter,
  sdkResponseView,
  sdkRequestView,
  graphql2json,
  json2graphql,
  raw2tree,
  getChildTree,
} = module.exports;

test("native parameter edits preserve selection, file paths, content types and unedited metadata", () => {
  const file = {
    key: "upload",
    type: "file",
    src: "/tmp/a.png",
    disabled: true,
    contentType: "image/png",
    description: "attachment",
    extraMetadata: "keep",
  };
  const row = sdkParameterToRow(file, "row-a");
  assert.equal(row.value, "/tmp/a.png");
  assert.equal(row.is_checked, -1);
  const edited = rowToSdkParameter(
    { ...row, value: "/tmp/b.png", is_checked: 1 },
    file,
    true,
  );
  assert.equal(edited.src, "/tmp/b.png");
  assert.equal(edited.disabled, false);
  assert.equal(edited.extraMetadata, "keep");
  assert.equal(edited.contentType, "image/png");
  assert.equal("value" in edited, false);
  const text = rowToSdkParameter(
    { ...row, field_type: "String", value: "text" },
    file,
    true,
  );
  assert.equal(text.type, "text");
  assert.equal(text.value, "text");
  assert.equal("src" in text, false);
  const query = rowToSdkParameter(
    sdkParameterToRow({ key: "q", value: "hello" }, "row-b"),
  );
  assert.equal("type" in query, false);
  assert.equal("is_checked" in query, false);
  assert.equal("param_id" in query, false);
});

test("editing a parameter retains structured descriptions and valueless query entries", () => {
  const original = {
    key: "flag",
    value: null,
    description: { content: "Optional flag", type: "text/markdown" },
  };
  const row = sdkParameterToRow(original, "flag");
  const edited = rowToSdkParameter({ ...row, is_checked: -1 }, original);
  assert.equal(edited.value, null);
  assert.deepEqual(edited.description, original.description);
  assert.equal(edited.disabled, true);
  assert.equal(
    rowToSdkParameter({ ...row, description: "Changed" }, original).description,
    "Changed",
  );
});

test("execution views read SDK snapshots without changing legacy payloads", () => {
  const response = {
    header: [{ key: "Content-Type", value: "application/json" }],
    body: '{"ok":true}',
    responseSize: 11,
    responseTime: 20,
    stream: { type: "Buffer", data: [123, 125] },
  };
  const original = structuredClone(response);
  assert.equal(sdkResponseView(response).responseTime, 20);
  assert.deepEqual(sdkResponseView(response).stream.data, [123, 125]);
  assert.deepEqual(response, original);
  assert.equal(
    sdkResponseView({
      headers: { "Content-Type": "text/plain" },
      response_time: 10,
    }),
    undefined,
  );
  const request = sdkRequestView({
    header: [],
    url: {
      query: [
        { key: "q", value: "1" },
        { key: "q", value: "2" },
      ],
      variable: [{ key: "id", value: "3" }],
    },
    body: { mode: "raw", raw: "" },
  });
  assert.deepEqual(
    request.query.map((row) => row.value),
    ["1", "2"],
  );
  assert.equal(request.variable[0].key, "id");
  assert.equal(request.body, "");
});

test("GraphQL field ASTs preserve nested arguments, decimals and variable type wrappers", () => {
  const query =
    "query Example { user(limit: 1.5, filter: {active: true, ids: [1, 2]}) { id name } }";
  const parsed = graphql2json(query);
  const roundtrip = graphql2json(json2graphql(parsed));
  assert.deepEqual(roundtrip, parsed);
  const document = json2graphql({
    name: "Names",
    variables: [{ name: "ids", type: "[ID!]", required: true }],
    children: [{ name: "names", arguments: [{ name: "ids", value: "$ids" }] }],
  });
  assert.match(document, /\$ids: \[ID!\]!/);
  assert.throws(
    () => graphql2json("fragment Fields on User { id }"),
    /operation/,
  );
  assert.throws(() => graphql2json("{ user { ...Fields } }"), /fragments/);
});

test("GraphQL schema expansion assigns descendant paths and terminates recursive object references", () => {
  const scalar = { kind: "SCALAR", name: "ID" };
  const user = { kind: "OBJECT", name: "User" };
  const schema = {
    queries: {
      kind: "OBJECT",
      name: "Query",
      fields: [{ name: "me", type: user, args: [] }],
    },
    objects: {
      User: {
        ...user,
        fields: [
          {
            name: "id",
            description: "identifier",
            type: { kind: "NON_NULL", ofType: scalar },
          },
          { name: "friend", type: user },
        ],
      },
    },
  };
  const { tree } = raw2tree(schema);
  const children = getChildTree(tree.Query.children[0], schema);
  assert.equal(children[0].key, "Query.me.id");
  assert.equal(children[0].non_null, true);
  assert.equal(children[0].description, "identifier");
  assert.equal(children[0].isLeaf, true);
  assert.equal(children[1].key, "Query.me.friend");
  assert.deepEqual(children[1].children, []);
  const nested = getChildTree(children[1], schema);
  assert.equal(nested[0].key, "Query.me.friend.id");
});

test("file parameter arrays survive an unchanged table edit", () => {
  const file = {
    key: "upload",
    type: "file",
    src: ["/tmp/a.png", "/tmp/b.png"],
    custom: true,
  };
  const row = sdkParameterToRow(file, "row-files");
  assert.equal(row.value, "/tmp/a.png\n/tmp/b.png");
  const edited = rowToSdkParameter(row, file, true);
  assert.deepEqual(edited.src, file.src);
  assert.equal(edited.custom, true);
});
