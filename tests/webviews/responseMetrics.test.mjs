import { test } from "node:test";
import assert from "node:assert/strict";
import load from "../helpers/loadTypeScript.mjs";
const { responseDownload } = await load(
  "apps/webviews/src/features/requests/response/response-download.ts",
  () => ({}),
  { Uint8Array },
);

test("download preparation preserves binary bytes, content type and stored response data", () => {
  const response = {
    header: [{ key: "Content-Type", value: "image/png" }],
    stream: { type: "Buffer", data: [0, 255, 128, 13] },
  };
  const original = structuredClone(response);
  const download = responseDownload(response, "result");
  assert.deepEqual(Array.from(download.data), [0, 255, 128, 13]);
  assert.equal(download.mime, "image/png");
  download.data[0] = 42;
  assert.deepEqual(response, original);
  assert.equal(responseDownload(undefined, "result"), undefined);
  assert.equal(
    responseDownload({ header: [], body: "plain" }, "result").data,
    "plain",
  );
});

test("downloads retain empty byte streams and use the default MIME type", () => {
  const response = {
    header: [],
    stream: { type: "Buffer", data: [] },
    body: "ignored",
  };
  const result = responseDownload(response, "empty");
  assert.deepEqual(Array.from(result.data), []);
  assert.equal(result.mime, "application/octet-stream");
  assert.equal(result.name, "empty.txt");
});
