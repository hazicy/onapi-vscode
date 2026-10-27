import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { rewriteLodashImports } from "../tooling/build/lodash-imports.mjs";
import load from "./helpers/loadTypeScript.mjs";

const fixtures = JSON.parse(
  fs.readFileSync(
    new URL("./fixtures/dataTools.json", import.meta.url),
    "utf8",
  ),
);
const original = {
  isJson: (value) => fixtures.json[String(value)],
  getUrlQueryArray: (value) => fixtures.queries[String(value)],
  array2Tree: (value, ...keys) =>
    fixtures.trees[JSON.stringify([value, ...keys])],
  completionHttpProtocol: (value) => {
    const result = fixtures.http[JSON.stringify(value)];
    if (value && typeof value === "object" && typeof value.url === "string")
      value.url = result.url;
    return result;
  },
};
const plain = (value) => JSON.parse(JSON.stringify(value));
const tools = await load(
  "packages/http-model/src/utils/data-tools.ts",
  () => ({}),
);

test("lightweight query and JSON helpers preserve existing data semantics", () => {
  for (const value of [
    undefined,
    null,
    1,
    "",
    "null",
    "true",
    "1",
    "{}",
    "[]",
    '{"x":1}',
    "{invalid}",
  ]) {
    assert.equal(tools.isJson(value), original.isJson(value));
  }
  for (const url of [
    undefined,
    "",
    "example.com",
    "?",
    "?a",
    "?a=",
    "?a=1&a=2&b=x=y",
    "?x=%2F+%20&raw={{variable}}",
    "?a=1#fragment",
  ]) {
    assert.deepEqual(
      plain(tools.getUrlQueryArray(url)),
      original.getUrlQueryArray(url),
    );
  }
});

test("lightweight tree construction handles unordered parents, mixed ID types and custom keys", () => {
  for (const items of [
    [],
    [
      { id: "empty-parent", pid: "" },
      { id: "false-parent", pid: false },
    ],
    [
      { id: "child", pid: 1 },
      { id: "1", pid: "0" },
    ],
    [
      { id: "parent" },
      { id: "child", pid: "parent" },
      { id: "orphan", pid: "missing" },
      { id: "", pid: 0 },
    ],
    [
      { id: "a", pid: 0 },
      { id: "a", pid: 0 },
    ],
  ]) {
    const snapshot = structuredClone(items);
    assert.deepEqual(
      plain(tools.array2Tree(items)),
      original.array2Tree(items),
    );
    assert.deepEqual(items, snapshot);
  }
  const custom = [
    { id: "a", parentId: "0" },
    { id: "b", parentId: "a" },
  ];
  assert.deepEqual(
    plain(tools.array2Tree(custom, "id", "parentId")),
    original.array2Tree(custom, "id", "parentId"),
  );
});

test("HTTP completion preserves object mutation and existing schemes", () => {
  for (const input of [
    null,
    1,
    "",
    "example.com",
    "https://example.com",
    "HTTP://example.com",
    {},
    { url: "example.com" },
    { url: 1 },
  ]) {
    const actual = structuredClone(input);
    const expected = structuredClone(input);
    assert.deepEqual(
      plain(tools.completionHttpProtocol(actual)),
      plain(original.completionHttpProtocol(expected)),
    );
    assert.deepEqual(actual, expected);
  }
});

test("lightweight IDs retain the existing seed, timestamp, radix and sequence layout", async () => {
  class FixedDate extends Date {
    constructor() {
      super(1792833000000);
    }
    static now() {
      return 1792833000000;
    }
  }
  const actual = await load(
    "packages/http-model/src/utils/data-tools.ts",
    () => ({}),
    {
      Date: FixedDate,
    },
  );
  for (let i = 0; i < 4200; i++) {
    const base = i % 2 ? 2 : 16;
    const id = actual.snowflakeId("request-project", base);
    if (fixtures.ids[i]) assert.equal(id, fixtures.ids[i]);
  }
});

test("Lodash optimization handles multiline imports, aliases and trailing commas", async () => {
  const source =
    'import {\n cloneDeep, isEqual as same,\n} from "lodash";\nexport { cloneDeep, same };';
  const optimized = rewriteLodashImports(source);
  assert.ok(!optimized.includes('from "lodash"'));
  assert.ok(optimized.includes('import cloneDeep from "lodash/cloneDeep.js"'));
  const result = await import(
    `data:text/javascript,${encodeURIComponent(optimized.replaceAll('"lodash/cloneDeep.js"', JSON.stringify(new URL("../node_modules/lodash/cloneDeep.js", import.meta.url).href)).replaceAll('"lodash/isEqual.js"', JSON.stringify(new URL("../node_modules/lodash/isEqual.js", import.meta.url).href)))}`
  );
  const value = { nested: [1, 2] };
  assert.notEqual(result.cloneDeep(value).nested, value.nested);
  assert.equal(result.same(value, result.cloneDeep(value)), true);
});
