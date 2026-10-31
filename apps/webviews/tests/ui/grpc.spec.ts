import { test, expect, type Page } from "@playwright/test";

const method = (
  name: string,
  requestStream = false,
  responseStream = false,
) => ({
  path: `/example.Greeter/${name}`,
  service: "example.Greeter",
  name,
  requestStream,
  responseStream,
  requestType: "example.Request",
  responseType: "example.Reply",
  example: { name: "" },
  fields: [
    { name: "name", type: "string", repeated: false, description: "Your name" },
  ],
});
async function emit(
  page: Page,
  type: string,
  fields: Record<string, unknown> = {},
) {
  await page.evaluate(
    ({ type, fields }) => {
      const command = (window as any).grpcMessages.findLast((message: any) =>
        ["grpc_discover", "grpc_invoke"].includes(message.action),
      );
      (window as any).grpcSequences ??= {};
      const sequence =
        ((window as any).grpcSequences[command.requestId] ?? 0) + 1;
      (window as any).grpcSequences[command.requestId] = sequence;
      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            action: "protocolExecutionEvent",
            data: {
              protocolVersion: 1,
              sessionId: command.requestId,
              targetId: "grpc-fixture",
              sequence,
              timestamp: Date.now(),
              event: { protocol: "grpc", type, ...fields },
            },
          },
        }),
      );
    },
    { type, fields },
  );
}
async function load(page: Page) {
  await page.goto("/?grpc");
  await page
    .getByRole("button", { name: "Load services", exact: true })
    .click();
  await emit(page, "schema.loaded", {
    value: {
      methods: [
        method("SayHello"),
        method("Upload", true),
        method("Chat", true, true),
      ],
      descriptorSet: "fixture",
    },
  });
  await emit(page, "execution.completed", { failed: false });
  await expect(page.getByLabel("gRPC method")).toBeVisible();
  await page.getByRole("button", { name: "Message", exact: true }).click();
}
const messageEditor = (page: Page) =>
  page
    .getByRole("group", { name: "gRPC message editor" })
    .locator(".cm-content");

test("gRPC discovers methods, generates a message, and shows response status, metadata and trailers", async ({
  page,
}) => {
  await load(page);
  await page.getByRole("button", { name: "Use example message" }).click();
  await expect(messageEditor(page)).toContainText('"name"');
  await messageEditor(page).fill('{"name":"World"}');
  await page.getByRole("button", { name: "Invoke", exact: true }).click();
  await emit(page, "call.started", {
    requestStream: false,
    responseStream: false,
  });
  await emit(page, "message.sent", { value: { name: "World" } });
  await emit(page, "metadata.received", {
    metadata: { "x-server": ["fixture"] },
  });
  await emit(page, "message.received", { value: { message: "Hello World" } });
  await emit(page, "status.received", {
    status: {
      code: 0,
      name: "OK",
      details: "OK",
      trailers: { "x-trailer": ["done"] },
      durationMs: 12,
    },
  });
  await emit(page, "execution.completed", { failed: false });
  await expect(page.getByRole("status")).toContainText("0 OK");
  await expect(page.getByText('"Hello World"', { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Trailers", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "done", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Metadata", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("cell", { name: "fixture", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Messages", exact: true }).click();
  await page.screenshot({
    path: "test-results/grpc-workspace.png",
    fullPage: true,
  });
});
test("gRPC streaming sends additional messages and half-closes without cancelling", async ({
  page,
}) => {
  await load(page);
  await page.getByLabel("gRPC method").selectOption("/example.Greeter/Chat");
  await page.getByRole("button", { name: "Invoke", exact: true }).click();
  await emit(page, "call.started", {
    requestStream: true,
    responseStream: true,
  });
  await messageEditor(page).fill('{"name":"second"}');
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  const sent = await page.evaluate(() => (window as any).grpcMessages.at(-1));
  expect(sent.action).toBe("grpc_write");
  expect(sent.data.message).toContain("second");
  await page
    .getByRole("button", { name: "End streaming", exact: true })
    .click();
  expect(
    await page.evaluate(() => (window as any).grpcMessages.at(-1).action),
  ).toBe("grpc_end");
  await expect(
    page.getByRole("button", { name: "Send message", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Cancel", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(
    await page.evaluate(() => (window as any).grpcMessages.at(-1).action),
  ).toBe("grpc_cancel");
  await emit(page, "execution.cancelled");
  await emit(page, "execution.completed", { failed: false });
  await expect(page.getByRole("status")).toContainText("Cancelled");
});
test("gRPC metadata and TLS settings participate in native save and document revert", async ({
  page,
}) => {
  await page.goto("/?grpc");
  await page
    .getByRole("button", { name: "Metadata", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "+ Add metadata" }).click();
  await page.getByLabel("Metadata key 1", { exact: true }).fill("x-request-id");
  await page
    .getByLabel("Metadata value 1", { exact: true })
    .fill("{{requestId}}");
  await page.getByRole("button", { name: "Enable TLS", exact: true }).click();
  await page.getByRole("button", { name: "Native save", exact: true }).click();
  const saved = await page.evaluate(() => (window as any).grpcMessages.at(-1));
  expect(saved.data.grpc.metadata[0]).toEqual({
    key: "x-request-id",
    value: "{{requestId}}",
    enabled: true,
  });
  expect(saved.data.grpc.tls.enabled).toBe(true);
  await page
    .getByRole("button", { name: "Revert document", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Enable TLS", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByLabel("Metadata key 1", { exact: true })).toHaveCount(
    0,
  );
});
test("gRPC imports proto definitions and preserves unfinished editor content on save", async ({
  page,
}) => {
  await page.goto("/?grpc");
  await page
    .getByRole("button", { name: "Protobuf files", exact: false })
    .click();
  await page
    .getByRole("button", { name: "Import .proto", exact: true })
    .click();
  await page.evaluate(() => {
    const command = (window as any).grpcMessages.at(-1);
    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          action: "grpcImported",
          requestId: command.requestId,
          data: {
            id: "grpc-fixture",
            files: [{ name: "hello.proto", content: 'syntax = "proto3";' }],
          },
        },
      }),
    );
  });
  const editor = page
    .getByRole("group", { name: "Proto definition editor" })
    .locator(".cm-content");
  await editor.fill('syntax = "proto3";\nmessage Unfinished {');
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const saved = await page.evaluate(() => (window as any).grpcMessages.at(-1));
  expect(saved.data.grpc.definition.files[0].content).toContain(
    "message Unfinished {",
  );
});
test("gRPC invalid JSON fails locally and narrow layouts remain usable", async ({
  page,
}) => {
  await load(page);
  await messageEditor(page).fill("{invalid");
  await page.getByRole("button", { name: "Invoke", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cancel", exact: true }),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 480, height: 900 });
  await expect(
    page.getByRole("button", { name: "Invoke", exact: true }),
  ).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("gRPC reopens source snapshots without persisting derived schemas or sending them in call commands", async ({
  page,
}) => {
  await page.goto("/?grpc&saved");
  await page.waitForFunction(() =>
    (window as any).grpcMessages?.some(
      (message: any) => message.action === "grpc_discover",
    ),
  );
  const described = await page.evaluate(() =>
    (window as any).grpcMessages.at(-1),
  );
  expect(described.data).toEqual({ id: "grpc-fixture", refresh: false });
  await emit(page, "schema.loaded", {
    value: { methods: [method("SayHello")] },
  });
  await emit(page, "execution.completed", { failed: false });
  await expect(page.getByLabel("gRPC method")).toBeVisible();
  await page.getByRole("button", { name: "Native save", exact: true }).click();
  const saved = await page.evaluate(
    () => (window as any).grpcMessages.at(-1).data,
  );
  expect(saved.grpc.definition.source).toBe("proto");
  expect(saved.grpc.definition.files).toHaveLength(1);
  expect(saved.grpc.methods).toBeUndefined();
  await page.getByRole("button", { name: "Invoke", exact: true }).click();
  expect(
    await page.evaluate(() => (window as any).grpcMessages.at(-1).data),
  ).toEqual({ id: "grpc-fixture" });
});
