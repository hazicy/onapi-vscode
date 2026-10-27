import type { Page } from "@playwright/test";

/** Simulate the same session envelope used by the extension host. */
export async function emitHttpEvents(
  page: Page,
  targetId: string,
  events: Record<string, unknown>[],
) {
  const send = page.getByRole("button", { name: "Send", exact: true });
  await page
    .getByRole("button", { name: /^(Send|Cancel sending|Close)$/ })
    .first()
    .waitFor();
  if (await send.isVisible()) {
    await send.click();
  }
  const sessionId = await page.evaluate(() => {
    const messages =
      (window as any).messages || (window as any).startupMessages || [];
    return messages.findLast((message: any) =>
      ["sendApi", "sendSse"].includes(message.action),
    )?.executionId;
  });
  if (!sessionId) {
    throw new Error("Send a request before emitting its host events");
  }
  await page.evaluate(
    ({ targetId, sessionId, events }) => {
      let sequence = 0;
      const emit = (event: Record<string, unknown>) =>
        window.dispatchEvent(
          new MessageEvent("message", {
            data: {
              action: "protocolExecutionEvent",
              data: {
                protocolVersion: 1,
                targetId,
                sessionId,
                sequence: ++sequence,
                timestamp: Date.now(),
                event: { protocol: "http", ...event },
              },
            },
          }),
        );
      emit({ type: "session.started", failed: false });
      for (const native of events) {
        emit({
          type:
            native.type === "responseData" ? "response.chunk" : "runtime.event",
          native,
        });
      }
    },
    { targetId, sessionId, events },
  );
  return { sessionId, sequence: events.length + 1 };
}
