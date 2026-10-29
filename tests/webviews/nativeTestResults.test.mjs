import { test } from "node:test";
import assert from "node:assert/strict";
import load from "../helpers/loadTypeScript.mjs";
const { nativeStatistics, nativeItems, itemFailed } = await load(
  "apps/webviews/src/features/testing/utils/native-results.ts",
  () => ({}),
);

test("native test statistics distinguish network failures, assertion failures and skipped assertions", () => {
  const events = [
    { type: "request", response: { code: 500, responseTime: 10 } },
    { type: "request", error: { message: "connection refused" } },
    {
      type: "assertion",
      assertions: [
        { assertion: "pass" },
        { assertion: "fail", error: { message: "mismatch" } },
        { skipped: true, error: { message: "skipped" } },
      ],
    },
  ];
  const stats = nativeStatistics(events);
  assert.equal(stats.requests, 2);
  assert.equal(stats.failedRequests, 1);
  assert.equal(stats.assertions, 2);
  assert.equal(stats.failedAssertions, 1);
  assert.equal(stats.requestRate, "50.00%");
  assert.equal(stats.assertionRate, "50.00%");
  assert.equal(stats.averageResponseTime, 5);
  assert.equal(itemFailed(events), true);
  assert.equal(
    itemFailed([
      {
        type: "assertion",
        assertions: [{ skipped: true, error: { message: "skip" } }],
      },
    ]),
    false,
  );
  assert.equal(nativeStatistics([]).requestRate, "0%");
});

test("native event grouping separates items and iterations without rewriting event objects", () => {
  const events = [];
  for (let iteration = 0; iteration < 2; iteration++) {
    for (let position = 0; position < 2; position++) {
      const cursor = { iteration, position };
      events.push({
        type: "request",
        cursor,
        request: { method: "GET", url: "https://example.com" },
      });
      events.push({
        type: "assertion",
        cursor,
        assertions: [{ assertion: "OK" }],
      });
      events.push({ type: "item", cursor });
    }
  }
  events.push({ type: "done" });
  const groups = nativeItems(events);
  assert.equal(groups.length, 4);
  assert.ok(groups.every((group) => group.length === 3));
  assert.equal(groups[0][0], events[0]);
  assert.equal(groups[3][0], events[9]);
});

test("report persistence saves native events without derived legacy results", async () => {
  const messages = [];
  const events = [
    { type: "request", response: { code: 200 } },
    { type: "done" },
  ];
  let reports;
  const state = {
    testingSendingData: {
      events,
      startedAt: 10,
      finishedAt: 20,
      environmentName: "Staging",
    },
    testingName: "Folder",
    testingConfig: { execute_count: 1 },
    eventList: [{ enabled: 1 }],
    testingReportList: [],
    updateTestingReportList: (value) => {
      reports = value;
    },
  };
  const { saveReport } = await load(
    "apps/webviews/src/features/testing/components/Testing/utils.ts",
    (id) => {
      if (id.endsWith("/useTesting"))
        return { default: { getState: () => state } };
      if (id.endsWith("/common")) return { STATUS_CODE: { ENABLE: 1 } };
      throw new Error(id);
    },
    {
      window: { vscode: { postMessage: (message) => messages.push(message) } },
    },
  );
  saveReport();
  assert.equal(reports[0].events, events);
  assert.equal(reports[0].startedAt, 10);
  assert.equal(reports[0].finishedAt, 20);
  assert.equal(reports[0].environmentName, "Staging");
  assert.equal(messages[0].data.reportList, reports);
  assert.ok(!("complete" in reports[0]) && !("requestList" in reports[0]));
});
