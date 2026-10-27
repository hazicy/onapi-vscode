import type { Page } from "@playwright/test";
export class RequestPage {
  constructor(readonly page: Page) {}

  async open(
    kind: string,
    request: unknown,
    systemConfig: Record<string, unknown> = {},
  ) {
    const errors: string[] = [];
    this.page.on("pageerror", (error) => {
      errors.push(error.message);
      console.error(error.message);
    });
    const initialData = {
      apiData: {
        id: "native",
        parentId: "0",
        project_id: "-1",
        name: "Native request",
        kind,
        request,
        event: [],
        response: [],
      },
      projectConfig: {},
      systemConfig,
      vscodeTheme: "Default Dark Modern",
      docBaseUrl: "",
    };
    await this.page.route("**/native.html", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<!doctype html><html><head><link rel="stylesheet" href="/webviews.css"></head><body><div id="root"></div><script>
      window.vscodeData=${JSON.stringify({ kind, initialData })};
      window.messages=[];window.vscode={postMessage(message){window.messages.push(message)}};
      window.resourceBaseUrl=location.origin;
      </script><script type="module" src="/tagPanel.js"></script></body></html>`,
      }),
    );
    await this.page.goto("http://127.0.0.1:4180/native.html");
    return errors;
  }
  get codeEditorTextbox() {
    return this.page.getByRole("textbox", { name: "Code editor" });
  }

  get enterURLTextbox() {
    return this.page.getByRole("textbox", {
      name: "Enter URL",
      exact: true,
    });
  }

  get sendButton() {
    return this.page.getByRole("button", { name: "Send", exact: true });
  }

  get input() {
    return this.page.locator("input");
  }

  get authTab() {
    return this.page.getByRole("tab", { name: "Auth", exact: true });
  }

  get authTabpanel() {
    return this.page.getByRole("tabpanel", { name: "Auth", exact: true });
  }

  get table() {
    return this.page.getByRole("table");
  }

  get saveButton() {
    return this.page.getByRole("button", { name: "Save", exact: true });
  }

  get enterURLOrPasteCURLTextTextbox() {
    return this.page.getByRole("textbox", {
      name: "Enter URL or paste cURL text",
    });
  }

  get multiPartTab() {
    return this.page.getByRole("tab", { name: "Multi-Part", exact: true });
  }

  get multiPartTabpanel() {
    return this.page.getByRole("tabpanel", { name: "Multi-Part", exact: true });
  }

  get enterURLOrPasteCURLTextInput() {
    return this.page.getByPlaceholder("Enter URL or paste cURL text");
  }

  get loading() {
    return this.page.getByLabel("Loading", { exact: true });
  }

  get pathTab() {
    return this.page.getByRole("tab", { name: "Path", exact: true });
  }

  get paramsTab() {
    return this.page.getByRole("tab", { name: "Params", exact: true });
  }

  get consoleTab() {
    return this.page.getByRole("tab", { name: "Console", exact: true });
  }

  get responseTab() {
    return this.page.getByRole("tab", { name: "Response", exact: true });
  }

  get startupDeferredResponseCheck() {
    return this.page.getByText("Startup deferred response check", {
      exact: true,
    });
  }

  get toggleWordWrapButton() {
    return this.page.getByRole("button", { name: "Toggle word wrap" });
  }

  get codeButton() {
    return this.page.getByRole("button", { name: "Code", exact: true });
  }

  get tab() {
    return this.page.getByRole("tab");
  }

  get contenteditableTrue() {
    return this.page.locator('[contenteditable="true"]');
  }
}
