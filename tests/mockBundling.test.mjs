import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { build } from "esbuild";
import Ajv from "ajv";
import JSON5 from "json5";
import { fakerLocalesEsbuild } from "../tooling/build/faker-locales.mjs";

await fs.mkdir("test-results", { recursive: true });
const result = await build({
  stdin: {
    contents: `export {default as fakerDefinitions} from './packages/domain/src/mock/faker-definitions.json';
export * from './packages/domain/src/mock/expressions.js';
export {generateIdCard,generateBankCard} from './packages/domain/src/mock/cards.ts';
export {default as MockSchema} from './packages/domain/src/mock/schema.ts';
export {generateMockBody} from './apps/webviews/src/features/requests/utils/generateMockBody';
export {createVariableReplacer} from './packages/runtime/src/websocket/options';`,
    resolveDir: process.cwd(),
  },
  outfile: "test-results/mock-replacement.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  metafile: true,
  plugins: [fakerLocalesEsbuild()],
  banner: {
    js: `import {createRequire} from 'node:module';const require=createRequire(import.meta.url);`,
  },
});
const api = await import("../test-results/mock-replacement.mjs");

test("replacement graph excludes old engines, legacy Faker, idcard and crypto polyfills", () => {
  assert.doesNotMatch(
    Object.keys(result.metafile.inputs).join("\n"),
    /node_modules\/(exp-mock|apipost-mock-schema|mockjs5-pro|apipost-mock|mockjs|json2json-schema|idcard|crypto-js|crypto-browserify)\//,
  );
});

test("removed Mock.js expressions stay unresolved", () => {
  for (const expression of [
    "{{$mockjs.integer(1,10)}}",
    "{{$randomCity}}",
    "{{$email}}",
    "@integer(1,10)",
  ]) {
    assert.equal(api.mockExp(expression, {}), expression);
  }
});

test("expressions retain locales, parameter options, variables and unknown expressions", () => {
  for (const language of [
    "en",
    "zh-cn",
    "zh-tw",
    "zh-hant",
    "ja",
    "id",
    "de",
    "fr",
    "unsupported",
  ])
    for (const expression of [
      "{{$fakerjs.person.firstName}}",
      "{{$fakerjs.internet.email}}",
    ])
      assert.notEqual(
        api.mockExp(expression, {}, language),
        expression,
        language + expression,
      );
  assert.equal(api.mockExp("{{$fakerjs.number.int(min=7,max=7)}}", {}), 7);
  assert.equal(api.mockExp("{{host|upper()}}", { host: "example" }), "EXAMPLE");
  assert.equal(
    api.mockExp("{{nested.value}}", { nested: { value: false } }),
    false,
  );
  assert.equal(api.mockExp("{{missing}}", {}), "{{missing}}");
  assert.equal(
    api.mockExp("{{$fakerjs.unknown.method}}", {}),
    "{{$fakerjs.unknown.method}}",
  );
  assert.equal(api.mockExp("ordinary text", {}), "ordinary text");
  assert.equal(api.decryptString(api.encryptString("a,b\nc")), "a,b\nc");
});

test("hash and text pipes preserve synchronous results including Unicode", () => {
  for (const hash of ["md5", "sha1", "sha224", "sha256", "sha384", "sha512"])
    assert.equal(
      api.mockExp(`{{text|${hash}()}}`, { text: "你好 abc" }),
      createHash(hash).update("你好 abc").digest("hex"),
    );
  assert.equal(
    api.mockExp("{{text|base64()|unbase64()}}", { text: "你好 abc" }),
    "你好 abc",
  );
  assert.equal(
    api.mockExp("{{text|substr(1,2)|upper()|concat(!)}}", { text: "abcd" }),
    "BC!",
  );
  assert.equal(
    api.mockExp("{{text|format(YYYY-MM-DD,+08:00)}}", {
      text: "2026-01-01T20:00:00Z",
    }),
    "2026-01-02",
  );
});

test("custom functions do not leak between evaluations", () => {
  assert.equal(
    api.mockExp("{{text|fn_test()}}", { text: "x" }, "en", {
      fn_test: "return text + '!';",
    }),
    "x!",
  );
  assert.equal(api.mockExp("{{text|fn_test()}}", { text: "x" }), "x");
  assert.equal(
    api.mockExp("{{$function.fn_test(abc)}}", {}, "en", {
      fn_test: "return text.toUpperCase();",
    }),
    "ABC",
  );
});

test("ID and bank cards preserve parameters and valid check digits", () => {
  assert.match(api.generateIdCard(), /^\d{17}[0-9X]$/);
  const card = api.generateIdCard({ areacode: "110101", birth: "19900101" });
  assert.match(card, /^11010119900101\d{3}[0-9X]$/);
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  assert.equal(
    card[17],
    "10X98765432"[
      [...card.slice(0, 17)].reduce(
        (sum, digit, i) => sum + Number(digit) * weights[i],
        0,
      ) % 11
    ],
  );
  const bank = api.generateBankCard({ bin: "622202", length: 16 });
  assert.match(bank, /^622202\d{10}$/);
  assert.equal(
    [...bank].reverse().reduce((sum, char, i) => {
      let n = Number(char) * (i % 2 ? 2 : 1);
      return sum + (n > 9 ? n - 9 : n);
    }, 0) % 10,
    0,
  );
  assert.match(
    api.mockExp(
      "{{$fakerjs.string.idcard(areacode=110101,birth=19900101)}}",
      {},
    ),
    /^11010119900101/,
  );
});

test("Schema generation respects constraints, references, compositions and optional fields", async () => {
  const schema = {
    type: "object",
    required: ["age", "tags"],
    definitions: { label: { type: "string", pattern: "^[A-Z]{3}[0-9]{2}$" } },
    properties: {
      name: { $ref: "#/definitions/label" },
      age: { type: "integer", minimum: 20, maximum: 30 },
      tags: {
        type: "array",
        minItems: 2,
        maxItems: 2,
        items: { type: "string" },
      },
      status: { type: "string", enum: ["ok", "pending"] },
      nested: {
        allOf: [
          { type: "object", properties: { enabled: { type: "boolean" } } },
          { type: "object", properties: { count: { type: "integer" } } },
        ],
      },
    },
  };
  const snapshot = structuredClone(schema),
    validate = new Ajv().compile(schema);
  for (let i = 0; i < 30; i++) {
    const value = await new api.MockSchema().mock(schema);
    assert.ok(validate(value), JSON.stringify(validate.errors));
    assert.equal(typeof value.name, "string");
    assert.equal(typeof value.nested.enabled, "boolean");
    assert.equal(typeof value.nested.count, "number");
  }
  assert.deepEqual(schema, snapshot);
});

test("Schema defaults, examples, enums and field mocks preserve precedence", async () => {
  const engine = new api.MockSchema();
  assert.equal(
    await engine.mock({
      type: "string",
      default: "default",
      example: "example",
    }),
    "default",
  );
  assert.equal(
    await engine.mock({ type: "string", example: "example" }),
    "example",
  );
  assert.equal(
    await engine.mock({
      type: "integer",
      enum: [9],
      mock: { mock: "{{$fakerjs.number.int(min=7,max=7)}}" },
    }),
    9,
  );
  assert.equal(
    await engine.mock({
      type: "integer",
      default: 1,
      mock: { mock: "{{$fakerjs.number.int(min=7,max=7)}}" },
    }),
    7,
  );
  assert.equal(
    await engine.mock({ type: "boolean", mock: { mock: "false" } }),
    false,
  );
  assert.equal(
    await engine.mock({
      type: "integer",
      format: "int32",
      mock: { mock: "{{$fakerjs.number.int(min=7,max=7)}}" },
    }),
    7,
  );
  assert.equal(await engine.mock({ type: "integer", default: "42" }), 42);
  assert.match(
    await engine.mock({
      type: "string",
      mock: { mock: "{{$fakerjs.internet.email}}" },
    }),
    /@/,
  );
  assert.match(
    await engine.mock({ type: "string", format: "color" }),
    /^#[\da-f]{6}$/i,
  );
  for (let i = 0; i < 10; i++)
    assert.ok(
      [null, 7].includes(
        await engine.mock({
          type: "integer",
          enum: [7],
          apipiost_allow_null: true,
        }),
      ),
    );
});

test("Schema field rules support wildcards, case sensitivity, references and overrides", async () => {
  const rules = [
    {
      type: "integer",
      match_type: "wildcard",
      match_case: -1,
      match_rule: "*count",
      mock_type: 1,
      mock: "{{$fakerjs.number.int(min=7,max=7)}}",
    },
  ];
  const schema = {
    type: "object",
    properties: {
      itemCount: { type: "integer" },
      nested: {
        type: "object",
        properties: {
          COUNT: { type: "integer" },
          fixedCount: {
            type: "integer",
            mock: { mock: "{{$fakerjs.number.int(min=9,max=9)}}" },
          },
        },
      },
    },
  };
  assert.deepEqual(await new api.MockSchema().mock(schema, rules), {
    itemCount: 7,
    nested: { COUNT: 7, fixedCount: 9 },
  });
  const exact = [
    {
      type: "string",
      match_type: "exact",
      match_case: 1,
      match_rule: "NAME",
      mock_type: 1,
      mock: "fixed",
    },
  ];
  assert.deepEqual(
    await new api.MockSchema().mock(
      { type: "object", properties: { NAME: { type: "string" } } },
      exact,
    ),
    { NAME: "fixed" },
  );
  assert.deepEqual(
    await new api.MockSchema().mock(
      {
        type: "object",
        definitions: { item: { type: "integer" } },
        properties: { itemCount: { $ref: "#/definitions/item" } },
      },
      rules,
    ),
    { itemCount: 7 },
  );
});

test("body generation preserves JSON5 structure and leaves invalid input untouched", async () => {
  const value = JSON.parse(
    await api.generateMockBody("{ name: 'example', age: 20, tags: ['tag'], }"),
  );
  assert.equal(typeof value.name, "string");
  assert.equal(typeof value.age, "number");
  assert.ok(Array.isArray(value.tags));
  for (const source of ["not JSON", "<root/>", "{broken"])
    assert.equal(await api.generateMockBody(source), source);
  assert.deepEqual(JSON5.parse(await api.generateMockBody({ count: 1 })), {
    count: 1,
  });
});

test("WebSocket replacement uses Faker expressions", async () => {
  const replace = await api.createVariableReplacer({
    globals: { host: "example" },
    custom_functions: { fn_test: "return text + '!';" },
  });
  assert.equal(
    await replace("{{host|upper()}}/{{$fakerjs.number.int(min=7,max=7)}}"),
    "EXAMPLE/7",
  );
  assert.equal(await replace("{{$function.fn_test(hello)}}"), "hello!");
  assert.equal(await replace("{{$randomCity}}"), "{{$randomCity}}");
  assert.equal(await replace("{{missing}}"), "{{missing}}");
});

test("Faker discovery and execution use the same definitions without a UI fallback catalog", async () => {
  assert.deepEqual(api.getFakerObject(), api.fakerDefinitions);
  const keys = api.fakerDefinitions.map(
    (item) => `${item.module}.${item.function}`,
  );
  assert.equal(new Set(keys).size, keys.length);
  for (const definition of api.fakerDefinitions) {
    assert.equal(typeof definition.module, "string");
    assert.equal(typeof definition.function, "string");
    assert.equal(typeof definition.params, "object");
  }
});
