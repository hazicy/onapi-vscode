import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "./helpers/loadTypeScript.mjs";
const { timingSegments } = await load(
  "apps/webviews/src/features/requests/utils/response-metrics.ts",
  nativeDependency,
);
const tools = await load(
  "packages/domain/src/utils/response-tools.ts",
  nativeDependency,
  { TextEncoder, TextDecoder, btoa },
);
const { responseDownload } = await load(
  "apps/webviews/src/features/requests/utils/response-download.ts",
  () => tools,
  { Uint8Array },
);

test("timing widths remain finite for empty runs and reflect the execution phases", () => {
  assert.equal(timingSegments().length, 0);
  const zero = timingSegments({
    prepare: { duration: 0 },
    process: { duration: 0 },
  });
  assert.ok(
    zero.every(
      (item) => Number.isFinite(item.width) && Number.isFinite(item.marginLeft),
    ),
  );
  const segments = timingSegments({
    prepare: { duration: 10 },
    waiting: { duration: 80 },
    process: { duration: 10 },
  });
  assert.equal(segments.find((item) => item.key === "waiting").width, 80);
  assert.equal(segments.find((item) => item.key === "process").marginLeft, 90);
});

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
  const legacy = {
    mime_type: { mime: "image/png", ext: "png" },
    stream: { data: [0, 255] },
    fit_for_show: "Image",
  };
  const snapshot = structuredClone(legacy);
  assert.deepEqual(
    Array.from(responseDownload(legacy, "result").data),
    [0, 255],
  );
  assert.deepEqual(legacy, snapshot);
  assert.equal(responseDownload(undefined, "result"), undefined);
  assert.equal(
    responseDownload({ header: [], body: "plain" }, "result").data,
    "plain",
  );
});
