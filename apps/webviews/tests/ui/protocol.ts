import type { Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

/** Simulate the same session envelope used by the extension host. */
export async function emitHttpEvents(
  page: Page,
  targetId: string,
  events: Record<string, unknown>[],
) {
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
    { targetId, sessionId: randomUUID(), events },
  );
}
