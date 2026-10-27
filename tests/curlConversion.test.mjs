import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import curl from "curl-to-postmanv2";
import sdk from "postman-collection";

const bundle = await build({
  stdin: {
    contents:
      'export * from "./packages/domain/src/curl/utils/postman-request"; export * from "./apps/webviews/src/shared/components/ParameterConversion/convert";',
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  metafile: true,
  plugins: [
    {
      name: "ids",
      setup(builder) {
        builder.onResolve({ filter: /^@\/shared\/utils\/dataTools$/ }, () => ({
          path: "ids",
          namespace: "ids",
        }));
        builder.onLoad({ filter: /.*/, namespace: "ids" }, () => ({
          contents:
            "let id = 0; export const snowflakeId = () => String(++id);",
        }));
      },
    },
  ],
});
const {
  fromCurlPostmanRequest: adapt,
  importParameters,
  exportParameters,
} = await import(
  "data:text/javascript;base64," +
    Buffer.from(bundle.outputFiles[0].text).toString("base64")
);
const convert = (command) =>
  new Promise((resolve, reject) =>
    curl.convert({ type: "string", data: command }, (error, result) => {
      if (error || !result.result) return reject(error || result.reason);
      resolve(adapt(result.output[0].data));
    }),
  );

test("cURL preserves duplicate and encoded query values, headers and basic auth", async () => {
  const api = await convert(
    "curl 'https://example.com/path?a=x%252Fy&a=2&token=a=b#section' -H 'X-Test: yes' -u 'user:pass'",
  );
  assert.equal(api.request.method, "GET");
  assert.deepEqual(
    new sdk.Url(api.request.url).query
      .toJSON()
      .map(({ key, value }) => [key, value]),
    [
      ["a", "x%252Fy"],
      ["a", "2"],
      ["token", "a=b"],
    ],
  );
  assert.ok(
    api.request.header.some((p) => p.key === "X-Test" && p.value === "yes"),
  );
  assert.deepEqual(
    Object.fromEntries(
      api.request.auth.basic.map((item) => [item.key, item.value]),
    ),
    {
      username: "user",
      password: "pass",
    },
  );
  assert.equal(api.request.auth.type, "basic");
});

test("cURL imports JSON and URL-encoded bodies", async () => {
  const json = await convert(
    `curl https://example.com -H 'Content-Type: application/json' --data '{"n":1}'`,
  );
  assert.equal(json.request.method, "POST");
  assert.equal(json.request.body.mode, "raw");
  assert.deepEqual(JSON.parse(json.request.body.raw), { n: 1 });
  const form = await convert("curl https://example.com -d 'a=1&b=2'");
  assert.equal(form.request.body.mode, "urlencoded");
  assert.deepEqual(
    form.request.body.urlencoded.map(({ key, value }) => [key, value]),
    [
      ["a", "1"],
      ["b", "2"],
    ],
  );
});

test("cURL imports multipart text and file paths", async () => {
  const api = await convert(
    "curl https://example.com -F 'title=hello' -F 'upload=@/tmp/photo.png'",
  );
  assert.equal(api.request.body.mode, "formdata");
  assert.ok(
    api.request.body.formdata.some(
      (p) => p.key === "title" && p.value === "hello",
    ),
  );
  assert.ok(
    api.request.body.formdata.some(
      (p) =>
        p.key === "upload" &&
        p.type === "file" &&
        [].concat(p.src).includes("/tmp/photo.png"),
    ),
  );
});

test("Postman adapter handles structured URLs, disabled fields and auth mappings", () => {
  const api = adapt({
    url: {
      raw: "https://example.com?a=1",
      query: [{ key: "a", value: "1", disabled: true }],
    },
    header: [{ key: "X", disabled: true }],
    auth: { type: "bearer", bearer: [{ key: "token", value: "secret" }] },
  });
  assert.equal(api.request.url.query[0].disabled, true);
  assert.equal(api.request.header[0].disabled, true);
  assert.equal(
    api.request.auth.bearer.find((item) => item.key === "token").value,
    "secret",
  );
  const digest = adapt({
    url: "https://example.com",
    auth: {
      type: "digest",
      digest: [
        { key: "nonceCount", value: "01" },
        { key: "clientNonce", value: "abc" },
      ],
    },
  });
  assert.equal(
    digest.request.auth.digest.find((item) => item.key === "nonceCount").value,
    "01",
  );
  assert.equal(
    digest.request.auth.digest.find((item) => item.key === "clientNonce").value,
    "abc",
  );
  const key = adapt({
    url: "https://example.com",
    auth: {
      type: "apikey",
      apikey: [
        { key: "key", value: "token" },
        { key: "value", value: "secret" },
      ],
    },
  });
  assert.equal(key.request.auth.type, "apikey");
  assert.equal(
    key.request.auth.apikey.find((item) => item.key === "value").value,
    "secret",
  );
});

test("adapter gives each request independent defaults and rejects missing requests", () => {
  const a = adapt({ url: "https://example.com" });
  a.request.url = "changed";
  const b = adapt({ url: "https://example.com" });
  assert.equal(b.request.url, "https://example.com");
  assert.notEqual(a.id, b.id);
  for (const input of [null, undefined, {}, { url: {} }])
    assert.equal(adapt(input), false);
  assert.ok(
    Object.keys(bundle.metafile.inputs).every(
      (p) => !/apipost-(?:inside-)?tools/.test(p),
    ),
  );
});

test("parameter conversion preserves metadata, JSON5, false and zero", () => {
  const rows = importParameters(
    `[{key:'a',value:0,is_checked:-1,description:'note',field_type:'Integer'},{key:'b',value:false},{key:'file',type:'File',field_type:'File',value:'/tmp/a'}]`,
  );
  assert.equal(rows[0].value, "0");
  assert.equal(rows[0].is_checked, -1);
  assert.equal(rows[0].description, "note");
  assert.equal(rows[1].value, "false");
  assert.deepEqual(importParameters(exportParameters(rows, "json-desc")), rows);
  assert.deepEqual(JSON.parse(exportParameters(rows, "json")), {
    a: "0",
    b: "false",
    file: "/tmp/a",
  });
  assert.deepEqual(
    importParameters("{a: {nested: true}}").map((p) => p.value),
    ['{"nested":true}'],
  );
});

test("key:value parameter format keeps colons in values", () => {
  const rows = importParameters(
    "Host: https://example.com:8080\r\nX-Test: hello\n",
  );
  assert.equal(rows[0].value, "https://example.com:8080");
  assert.equal(
    exportParameters(rows),
    "Host:https://example.com:8080\nX-Test:hello\n",
  );
  assert.deepEqual(importParameters(""), []);
});
