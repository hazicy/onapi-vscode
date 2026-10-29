import type { ExecutionEvent } from "@onapi/contracts";

export function nativeItems(events: ExecutionEvent[]) {
  const items = new Map<string, ExecutionEvent[]>();
  for (const event of events) {
    if (
      ![
        "beforeItem",
        "request",
        "assertion",
        "exception",
        "prerequest",
        "test",
        "item",
        "console",
      ].includes(event.type)
    ) {
      continue;
    }
    const cursor = event.cursor as
      | { iteration?: number; position?: number; ref?: string }
      | undefined;
    if (!cursor) {
      continue;
    }
    const key = `${cursor.iteration ?? 0}:${cursor.ref ?? cursor.position ?? 0}`;
    const group = items.get(key) || [];
    group.push(event);
    items.set(key, group);
  }
  return [...items.values()];
}

export function itemFailed(events: ExecutionEvent[]) {
  return events.some(
    (event) =>
      Boolean(event.error) ||
      event.assertions?.some(
        (assertion) => !assertion.skipped && Boolean(assertion.error),
      ),
  );
}

export function nativeStatistics(events: ExecutionEvent[]) {
  const requests = events.filter((event) => event.type === "request");
  const assertions = events
    .flatMap((event) =>
      event.type === "assertion" ? event.assertions || [] : [],
    )
    .filter((assertion) => !assertion.skipped);
  const failedRequests = requests.filter((event) => event.error).length;
  const failedAssertions = assertions.filter(
    (assertion) => assertion.error,
  ).length;
  return {
    requests: requests.length,
    failedRequests,
    assertions: assertions.length,
    failedAssertions,
    requestRate: rate(requests.length - failedRequests, requests.length),
    assertionRate: rate(
      assertions.length - failedAssertions,
      assertions.length,
    ),
    averageResponseTime: requests.length
      ? requests.reduce(
          (sum, event) => sum + (event.response?.responseTime || 0),
          0,
        ) / requests.length
      : 0,
  };
}
function rate(success: number, total: number) {
  return total ? `${((success / total) * 100).toFixed(2)}%` : "0%";
}
