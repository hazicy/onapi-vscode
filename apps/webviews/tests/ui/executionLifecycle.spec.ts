import { expect } from "@playwright/test";
import { test } from "./fixtures";

test("a cancelled startup cannot claim a retry and preparation errors end sending", async ({
  page,
  requestPage,
}) => {
  const errors = await requestPage.open("api", {
    method: "GET",
    url: "https://example.com",
    header: [],
  });
  await expect(requestPage.sendButton).toBeVisible();
  await page.evaluate(() =>
    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          action: "protocolExecutionEvent",
          data: {
            protocolVersion: 1,
            sessionId: "unrelated",
            targetId: "native",
            sequence: 1,
            timestamp: Date.now(),
            event: {
              protocol: "http",
              type: "execution.error",
              error: { message: "unrelated failure" },
            },
          },
        },
      }),
    ),
  );
  await expect(
    page.getByRole("tab", { name: "Response", exact: true }),
  ).toHaveCount(0);
  const executionId = () =>
    page.evaluate(
      () =>
        (window as any).messages.findLast(
          (message: any) => message.action === "sendApi",
        )?.executionId as string,
    );
  await requestPage.sendButton.click();
  const first = await executionId();
  const cancel = page.getByRole("button", {
    name: "Cancel sending",
    exact: true,
  });
  await cancel.click();
  expect(
    await page.evaluate(
      () =>
        (window as any).messages.findLast(
          (message: any) => message.action === "stopSendApi",
        ).executionId,
    ),
  ).toBe(first);
  await requestPage.sendButton.click();
  const second = await executionId();
  expect(second).not.toBe(first);
  await page.evaluate((sessionId) => {
    const events = [
      { protocol: "http", type: "session.started", failed: false },
      { protocol: "http", type: "runtime.event", native: { type: "start" } },
      {
        protocol: "http",
        type: "runtime.event",
        native: {
          type: "request",
          response: { code: 200, body: "cancelled result" },
        },
      },
      {
        protocol: "http",
        type: "runtime.event",
        native: { type: "done", error: null },
      },
    ];
    events.forEach((event, index) =>
      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            action: "protocolExecutionEvent",
            data: {
              protocolVersion: 1,
              sessionId,
              targetId: "native",
              sequence: index + 1,
              timestamp: Date.now(),
              event,
            },
          },
        }),
      ),
    );
  }, first);
  await expect(cancel).toBeVisible();
  await expect(page.getByText("cancelled result", { exact: true })).toHaveCount(
    0,
  );
  await page.evaluate(
    (sessionId) =>
      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            action: "protocolExecutionEvent",
            data: {
              protocolVersion: 1,
              sessionId,
              targetId: "native",
              sequence: 1,
              timestamp: Date.now(),
              event: {
                protocol: "http",
                type: "execution.error",
                error: { message: "Preparation failed" },
              },
            },
          },
        }),
      ),
    second,
  );
  await expect(requestPage.sendButton).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Preparation failed");
  expect(errors).toEqual([]);
});
