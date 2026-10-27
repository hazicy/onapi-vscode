import type { Page } from "@playwright/test";
import { CodeEditor } from "../../components/CodeEditor";
export class WebSocketPage {
  constructor(readonly page: Page) {}
  get websocket() {
    return this.page.locator(".websocket");
  }

  get editors() {
    return this.page.locator(".cm-editor");
  }

  get alert() {
    return this.page.getByRole("alert");
  }

  get status() {
    return this.page.locator('[role="status"][data-status]');
  }

  get connectToSendAMessage() {
    return this.page.getByText("Connect to send a message", { exact: true });
  }

  get sendButton() {
    return this.page.getByRole("button", { name: "Send", exact: true });
  }

  get clearMessagesButton() {
    return this.page.getByRole("button", {
      name: "Clear Messages",
      exact: true,
    });
  }

  get connectButton() {
    return this.page.getByRole("button", { name: "Connect", exact: true });
  }

  get cancelButton() {
    return this.page.getByRole("button", { name: "Cancel", exact: true });
  }

  get searchTextbox() {
    return this.page.getByRole("textbox", { name: "Search", exact: true });
  }

  get filterHint() {
    return this.page.getByText("Try a different search or reset the filters.", {
      exact: true,
    });
  }

  get resetFiltersButton() {
    return this.page.getByRole("button", {
      name: "Reset filters",
      exact: true,
    });
  }

  get connectedSendAMessageOrWaitForTheServerToRespond() {
    return this.page.getByText(
      "Connected. Send a message or wait for the server to respond.",
      { exact: true },
    );
  }

  get selectAMessageOnTheLeftToInspectItsContent() {
    return this.page.getByText(
      "Select a message on the left to inspect its content.",
      {
        exact: true,
      },
    );
  }

  get disconnectButton() {
    return this.page.getByRole("button", { name: "Disconnect", exact: true });
  }
  get messageEditor() {
    return new CodeEditor(this.editors.first());
  }
}
