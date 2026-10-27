import { test } from "node:test";
import assert from "node:assert/strict";
import { gzipSync, deflateSync } from "node:zlib";
import load, { nativeDependency } from "./helpers/loadTypeScript.mjs";

const tools = await load(
  "packages/http-model/src/utils/response-tools.ts",
  nativeDependency,
  {
    TextEncoder,
    TextDecoder,
    btoa,
  },
);

test("response decoding preserves plain, gzip and zlib bytes and data URLs", () => {
  const body = Buffer.from("响应 body 😀");
  for (const bytes of [body, gzipSync(body), deflateSync(body)]) {
    for (const input of [
      bytes,
      Array.from(bytes),
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    ]) {
      const result = tools.bufferToRaw(input, { mime: "text/plain" });
      assert.equal(result.raw, body.toString());
      assert.deepEqual(Array.from(result.buffer), Array.from(body));
      assert.equal(
        result.base64,
        `data:text/plain;base64,${body.toString("base64")}`,
      );
    }
  }
  assert.equal(tools.bufferToRaw([], {}).raw, "");
});

test("XML detection recognizes documents and rejects plain values", () => {
  assert.equal(tools.isXml("<root><child /></root>"), true);
  for (const value of [null, undefined, 1, "", "plain text"]) {
    assert.equal(tools.isXml(value), false);
  }
});

const parse = await load(
  "packages/http-model/src/utils/parse.ts",
  async (id) =>
    [
      "@/shared/utils/responseTools",
      "@onapi/http-model/utils/response-tools",
    ].includes(id)
      ? tools
      : nativeDependency(id),
  { TextDecoder },
);

test("stream parsing decodes UTF-8 and GBK, with fallback for unsupported encodings", () => {
  const utf8 = Array.from(Buffer.from("响应 😀"));
  assert.equal(parse.parseStreamToRaw(utf8, {}), "响应 😀");
  assert.equal(parse.parseStreamToBody(utf8, {}).rawBody, "响应 😀");
  const gbk = [0xd6, 0xd0, 0xce, 0xc4];
  assert.equal(parse.parseStreamToRaw(gbk, {}, "gbk"), "中文");
  assert.equal(parse.parseStreamToBody(gbk, {}).rawBody, "中文");
  assert.equal(parse.parseStreamToRaw(utf8, {}, "unknown"), "响应 😀");
});

test("native bytes preserve binary data, subarray offsets, BOM and large Base64 payloads", () => {
  const bytes = new Uint8Array(200000).map((_, i) => i % 256);
  const result = tools.bufferToRaw(bytes.subarray(10, -10), {});
  assert.equal(
    result.base64,
    `data:undefined;base64,${Buffer.from(bytes.subarray(10, -10)).toString("base64")}`,
  );
  assert.equal(tools.bufferToRaw([239, 187, 191, 65], {}).raw, "\ufeffA");
  assert.equal(tools.bufferToRaw(undefined, {}).raw, "");
});
