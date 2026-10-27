import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import load from "./helpers/loadTypeScript.mjs";

const require = createRequire(
  new URL("../apps/extension/package.json", import.meta.url),
);
const sdk = require("postman-collection");
const generator = await load(
  "apps/extension/src/features/requests/code-generation.ts",
  (id) => require(id),
);
const { generateRequestCode, getCodeLanguages, selectCodeLanguage } = generator;

test("language selection migrates cURL and Node and falls back for removed variants", () => {
  assert.equal(selectCodeLanguage("shell", "curl").language, "curl");
  assert.equal(selectCodeLanguage("node", "axios").variant, "Axios");
  assert.equal(selectCodeLanguage("missing", "unknown").language, "curl");
  assert.equal(selectCodeLanguage("javascript", "fetch").variant, "Fetch");
});

test("cURL preserves encoding and repeated parameters and excludes disabled fields", async () => {
  const request = new sdk.Request({
    method: "POST",
    url: "https://example.com/a%2Fb?tag=one&tag=two&literal=%252F#fragment",
    header: [
      { key: "X-Test", value: "yes" },
      { key: "X-Hidden", value: "secret", disabled: true },
    ],
    body: { mode: "raw", raw: '{"url":"%2F"}' },
  });
  const code = await generateRequestCode(request, "curl", "cURL");
  assert.match(code, /a%2Fb\?tag=one&tag=two&literal=%252F/);
  assert.match(code, /X-Test: yes/);
  assert.match(code, /%2F/);
  assert.doesNotMatch(code, /fragment|X-Hidden/);
  assert.equal(request.url.hash, "fragment");
});

test("multipart retains files and excludes disabled form fields", async () => {
  const code = await generateRequestCode(
    new sdk.Request({
      method: "POST",
      url: "https://example.com/upload",
      body: {
        mode: "formdata",
        formdata: [
          { key: "file", type: "file", src: "/tmp/sample.txt" },
          { key: "name", type: "text", value: "sample" },
          { key: "hidden", type: "text", value: "secret", disabled: true },
        ],
      },
    }),
    "curl",
    "cURL",
  );
  assert.match(code, /sample.txt/);
  assert.match(code, /name=/);
  assert.doesNotMatch(code, /secret/);
});

for (const variables of ['{"id":"42"}', { id: "42" }]) {
  test(`GraphQL preserves variables supplied as ${typeof variables}`, async () => {
    const code = await generateRequestCode(
      new sdk.Request({
        method: "POST",
        url: "https://example.com/graphql",
        body: {
          mode: "graphql",
          graphql: { query: "query { user { id } }", variables },
        },
      }),
      "curl",
      "cURL",
    );
    assert.match(code, /42/);
    assert.match(code, /application\/json/);
  });
}

test("every advertised generator produces a snippet", async () => {
  for (const language of getCodeLanguages()) {
    for (const variant of language.variants) {
      const code = await generateRequestCode(
        new sdk.Request("https://example.com"),
        language.key,
        variant.key,
      );
      assert.equal(typeof code, "string", `${language.key}/${variant.key}`);
      assert.ok(code.length > 0);
    }
  }
});

test("unsupported generators reject instead of leaving a pending request", async () => {
  await assert.rejects(
    generateRequestCode(
      new sdk.Request("https://example.com"),
      "unknown",
      "unknown",
    ),
  );
});
