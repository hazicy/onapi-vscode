import { test } from "node:test";
import assert from "node:assert/strict";
import load from "../helpers/loadTypeScript.mjs";

const executionView = await load(
  "apps/webviews/src/features/requests/utils/executionView.ts",
  () => ({}),
);
const { responseIndicators } = await load(
  "apps/webviews/src/features/requests/utils/response-indicators.ts",
  () => executionView,
);

test("serialized responses preserve zero sizes and times without legacy details", () => {
  const result = responseIndicators({
    header: [],
    code: 204,
    responseSize: 0,
    responseTime: 0,
  });
  assert.equal(result.code, 204);
  assert.equal(result.size, 0);
  assert.equal(result.time, 0);
  assert.equal(result.timings, undefined);
  assert.equal(result.hasFormattedTimings, false);
});

test("legacy metrics prefer stream bytes and retain timing and network details", () => {
  const response = {
    mime_type: { mime: "text/plain" },
    code: 200,
    stream: { data: new ArrayBuffer(12) },
    response_size: 99,
    response_time: 45,
    timings: { request: 0, done: 45 },
    formatTimings: { total: { duration: 45 } },
    formatSize: { responseBody: 12 },
    network: { HTTPVersion: "1.1" },
    proxy: { href: "http://response-proxy:8080" },
  };
  const snapshot = structuredClone(response);
  const result = responseIndicators(response, {
    headers: {},
    proxy: { host: "request-proxy", port: 9000 },
  });
  assert.equal(result.size, 12);
  assert.equal(result.time, 45);
  assert.equal(result.timings, response.timings);
  assert.equal(result.formatTimings, response.formatTimings);
  assert.equal(result.formatSize, response.formatSize);
  assert.equal(result.network, response.network);
  assert.equal(result.hasFormattedTimings, true);
  assert.equal(result.proxy, "http://response-proxy:8080");
  assert.deepEqual(response, snapshot);
});

test("missing stream uses stored size and proxy falls back to the request", () => {
  const result = responseIndicators(
    { mime_type: {}, response_size: 30, response_time: 10 },
    { headers: {}, proxy: { host: "localhost", port: 8080 } },
  );
  assert.equal(result.size, 30);
  assert.equal(result.proxy, "localhost:8080");
  const empty = responseIndicators();
  assert.equal(empty.size, 0);
  assert.equal(empty.time, undefined);
  assert.equal(empty.proxy, undefined);
});
