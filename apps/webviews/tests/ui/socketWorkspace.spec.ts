import { expect, test } from "@playwright/test";

for (const protocol of ["websocket", "socketio"]) {
  test(`${protocol}: compose, send, inspect and return at narrow widths`, async ({
    page,
  }, testInfo) => {
    await page.goto(`/?socketWorkspace=${protocol}`);
    const workspace = page.getByRole("region", {
      name: "Socket workspace",
      exact: true,
    });
    const send = workspace.getByRole("button", { name: "Send", exact: true });
    await expect(send).toBeDisabled();
    await expect(
      workspace.getByRole("combobox", { name: "Saved messages", exact: true }),
    ).toBeVisible();
    await expect(
      workspace.getByRole("region", { name: "Message detail", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Narrow panel", exact: true })
      .click();
    await workspace
      .getByRole("button", { name: "Add message", exact: true })
      .click();
    await workspace
      .getByRole("textbox", { name: "Message name", exact: true })
      .fill("Second message");
    await workspace
      .getByRole("textbox", { name: "Message name", exact: true })
      .press("Enter");
    await expect(page.getByLabel("Socket definition")).toContainText(
      "Second message",
    );
    await workspace
      .getByRole("button", { name: "Delete message", exact: true })
      .click();
    await page.getByRole("button", { name: "Confirm", exact: true }).click();
    await expect(
      workspace.getByRole("combobox", { name: "Saved messages", exact: true }),
    ).toContainText("Greeting");
    await page
      .getByRole("button", { name: "Connected fixture", exact: true })
      .click();
    await expect(send).toBeEnabled();
    await send.click();
    const command = await page.evaluate(() =>
      (window as any).socketMessages.at(-1),
    );
    expect(command.action).toBe(
      protocol === "socketio" ? "socketio_send" : "ws_send",
    );
    expect(command.data).toMatchObject({
      id: "socket-ui",
      msg: "hello",
      type: "text",
    });
    if (protocol === "socketio") {
      expect(command.data).toMatchObject({ event: "chat", is_ack: -1 });
    }
    await workspace.getByText("server reply", { exact: true }).click();
    const detail = workspace.getByRole("region", {
      name: "Message detail",
      exact: true,
    });
    await expect(detail).toBeVisible();
    await expect(detail).toContainText("server reply");
    await detail
      .getByRole("button", { name: "Back to messages", exact: true })
      .click();
    await expect(detail).toHaveCount(0);
    await expect(
      workspace.getByText("server reply", { exact: true }),
    ).toBeVisible();
    expect(
      await workspace.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    const editor = workspace.locator(".cm-editor").first();
    expect((await editor.boundingBox())!.height).toBeGreaterThan(80);
    await workspace.screenshot({
      path: testInfo.outputPath(`${protocol}-narrow.png`),
    });
    await page.getByRole("button", { name: "Wide panel", exact: true }).click();
    await workspace.getByText("server reply", { exact: true }).click();
    await expect(detail).toBeVisible();
    await expect(
      workspace.getByRole("textbox", { name: "Search", exact: true }),
    ).toBeVisible();
    await workspace.screenshot({
      path: testInfo.outputPath(`${protocol}-wide.png`),
    });
  });
}

for (const protocol of ["websocket", "socketio"]) {
  test(`${protocol}: rename can be cancelled and deletion requires confirmation`, async ({
    page,
  }) => {
    await page.goto(`/?socketWorkspace=${protocol}`);
    const workspace = page.getByRole("region", {
      name: "Socket workspace",
      exact: true,
    });
    const definition = page.getByLabel("Socket definition");
    const presets = workspace.getByRole("combobox", {
      name: "Saved messages",
      exact: true,
    });
    const rename = workspace.getByRole("button", {
      name: "Rename message",
      exact: true,
    });
    const name = workspace.getByRole("textbox", {
      name: "Message name",
      exact: true,
    });
    await rename.click();
    await name.fill("Cancelled name");
    await expect(definition).not.toContainText("Cancelled name");
    await name.press("Escape");
    await expect(presets).toContainText("Greeting");
    await rename.click();
    await name.fill("Committed name");
    await name.press("Enter");
    await expect(definition).toContainText("Committed name");
    const remove = workspace.getByRole("button", {
      name: "Delete message",
      exact: true,
    });
    await remove.click();
    await expect(definition).toContainText('"raw":"hello"');
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(presets).toContainText("Committed name");
    await remove.click();
    await page.getByRole("button", { name: "Confirm", exact: true }).click();
    await expect(definition).toContainText('"message":[]');
    await workspace
      .getByRole("button", { name: "Add message", exact: true })
      .click();
    await expect(workspace.locator(".cm-editor")).toBeVisible();
    await expect(workspace.getByRole("button", { name: /save/i })).toHaveCount(
      0,
    );
    expect(
      await page.evaluate(() =>
        ((window as any).socketMessages || []).some(
          (message: any) => message.action === "saveApiData",
        ),
      ),
    ).toBe(false);
  });
}

test("socketio: empty timeline distinguishes connection and filter states", async ({
  page,
}) => {
  await page.goto("/?socketWorkspace=socketio");
  const workspace = page.getByRole("region", {
    name: "Socket workspace",
    exact: true,
  });
  await expect(
    workspace.getByText(
      "Enter a WebSocket URL above and click Connect to start.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Connected fixture", exact: true })
    .click();
  await workspace
    .getByRole("button", { name: "Clear Messages", exact: true })
    .click();
  await expect(
    workspace.getByText(
      "Connected. Send a message or wait for the server to respond.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Connected fixture", exact: true })
    .click();
  await workspace
    .getByRole("textbox", { name: "Search", exact: true })
    .fill("no matching message");
  await expect(
    workspace.getByText("Try a different search or reset the filters.", {
      exact: true,
    }),
  ).toBeVisible();
  await workspace
    .getByRole("button", { name: "Reset filters", exact: true })
    .click();
  await expect(
    workspace.getByText("server reply", { exact: true }),
  ).toBeVisible();
});
