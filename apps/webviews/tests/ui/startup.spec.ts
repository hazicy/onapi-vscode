import { emitHttpEvents } from "./protocol";
import { expect } from "@playwright/test";
import { test } from "./fixtures";

for (const moduleDelay of [0, 250]) {
  test(`request startup hydrates before rendering and defers optional modules (${moduleDelay}ms module delay)`, async ({
    page,
    requestPage,
  }) => {
    const errors: string[] = [];
    const scripts: string[] = [];
    page.on("request", (request) => {
      if (request.resourceType() === "script") {
        scripts.push(request.url());
      }
    });
    page.on("pageerror", (error) => errors.push(error.message));
    if (moduleDelay) {
      await page.route("**/chunks/*.js", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, moduleDelay));
        await route.continue();
      });
    }
    await page.route("**/startup.html", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<!doctype html><html lang="en"><head>
      <link rel="stylesheet" href="/webviews.css"></head><body><div id="root"></div>
      <script>
      performance.mark('onapi:html-ready');
      window.vscodeData = { kind: 'api' };
      window.loadingRowCounts = [];
      new MutationObserver(() => {
        if (!performance.getEntriesByName('onapi:content-ready').length) {
          document.querySelectorAll('[aria-label="Loading"]').forEach(element => {
            window.loadingRowCounts.push(element.children.length);
          });
        }
      }).observe(document.getElementById('root'), { childList: true, subtree: true });
      window.startupMessages = [];
      window.resourceBaseUrl = location.origin;
      const initialMessage = {
            action: 'setInitialData', data: {
              projectConfig: {}, systemConfig: { raw_parameter_pilot_bubble_switch: false },
              vscodeTheme: 'Default Dark Modern', docBaseUrl: '',
              apiData: {
                id: 'startup-api', kind: 'api', project_id: '-1',
                parentId: '0', name: 'Startup request',
                request: { method: 'GET', url: '', header: [], auth: {type:'noauth'} },
                event: [], response: []
              }
            }
          };
      window.vscodeData.initialData = initialMessage.data;
      window.vscode = { postMessage(message) {
        window.startupMessages.push({ action: message.action, ...(message.executionId ? {executionId: message.executionId} : {}),
          ...(message.action === "generateCode" ? { data: message.data } : {}),
          contentReady: performance.getEntriesByName('onapi:content-ready').length });
        if (message.action === 'getApiList') {
          window.dispatchEvent(new MessageEvent('message', {
            data: { action: 'setApiList', data: [] }
          }));
        }
      }};
      </script><script type="module" src="/tagPanel.js"></script></body></html>`,
      }),
    );
    await page.goto("http://127.0.0.1:4180/startup.html");
    await expect(requestPage.enterURLOrPasteCURLTextInput).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as any).startupMessages.filter(
            (message: any) => message.action === "getApiList",
          ),
        ),
      )
      .toEqual([{ action: "getApiList", contentReady: 1 }]);
    const actions = await page.evaluate(() =>
      (window as any).startupMessages.map((message: any) => message.action),
    );
    expect(actions).not.toContain("getInitialData");
    expect(
      await page.evaluate(
        () =>
          performance.getEntriesByName("onapi:data-ready")[0].startTime <
          performance.getEntriesByName("onapi:react-mounted")[0].startTime,
      ),
    ).toBe(true);
    // First render must use the already resolved protocol component. Rendering a
    // lazy placeholder first puts startup on React's throttled Suspense retry lane.
    expect(
      await page.evaluate(
        () =>
          performance.getEntriesByName("onapi:protocol-ready")[0].startTime <=
          performance.getEntriesByName("onapi:react-mounted")[0].startTime,
      ),
    ).toBe(true);
    for (const action of [
      "getApiData",
      "getProjectConfig",
      "getSystemConfig",
      "getVscodeTheme",
      "getDocBaseUrl",
      "generateCode",
    ]) {
      expect(actions).not.toContain(action);
    }
    expect(
      await page.evaluate(
        () => performance.getEntriesByName("onapi:html-to-content").length,
      ),
    ).toBe(1);
    expect(await page.evaluate(() => (window as any).loadingRowCounts)).toEqual(
      [],
    );
    await expect(requestPage.loading).toHaveCount(0);
    // A hidden request tab must not fetch its module until first selected,
    // even though the underlying Tabs panels use keepMounted.
    await page.waitForLoadState("networkidle");
    const startupPayload = await page.evaluate(() => {
      const scripts = (
        performance.getEntriesByType("resource") as PerformanceResourceTiming[]
      ).filter((entry) => new URL(entry.name).pathname.endsWith(".js"));
      return {
        jsFiles: scripts.length,
        jsBytes: scripts.reduce((sum, entry) => sum + entry.decodedBodySize, 0),
        contentMilliseconds: performance.getEntriesByName(
          "onapi:html-to-content",
        )[0]?.duration,
      };
    });
    console.log("Request startup payload:", JSON.stringify(startupPayload));
    // Includes modules loaded after the first paint (for example the collection
    // selector). Catch heavy utilities returning to the initial page dependency graph.
    expect(startupPayload.jsBytes).toBeLessThan(2_400_000);
    await requestPage.pathTab.click();
    await expect(requestPage.pathTab).toHaveAttribute("aria-selected", "true");
    await requestPage.paramsTab.click();
    await page.waitForLoadState("networkidle");
    await expect(requestPage.responseTab).toHaveCount(0);
    await requestPage.sendButton.click();
    await emitHttpEvents(page, "startup-api", [
      { type: "start" },
      { type: "request", response: { code: 200, body: "{}" } },
      { type: "done", error: null },
    ]);
    await expect(requestPage.responseTab).toBeVisible();
    await page.waitForLoadState("networkidle");
    const beforeConsole = scripts.length;
    await requestPage.consoleTab.click();
    await expect.poll(() => scripts.length).toBeGreaterThan(beforeConsole);
    await requestPage.responseTab.click();
    // The deferred response implementation must still handle host results.
    await emitHttpEvents(page, "startup-api", [
      { type: "done", error: { message: "Startup deferred response check" } },
    ]);
    await expect(
      page
        .getByRole("alert")
        .getByText("Startup deferred response check", { exact: true }),
    ).toBeVisible();
    await emitHttpEvents(page, "startup-api", [
      { type: "start" },
      {
        type: "request",
        request: { method: "GET", url: "https://example.com", header: [] },
        response: {
          code: 200,
          status: "OK",
          responseTime: 10,
          header: [{ key: "content-type", value: "application/json" }],
          stream: {
            type: "Buffer",
            data: Array.from(new TextEncoder().encode('{"ok":true}')),
          },
        },
      },
      { type: "done", error: null },
    ]);
    await expect(requestPage.toggleWordWrapButton).toBeVisible();
    await requestPage.codeButton.click();
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as any).startupMessages.some(
            (message: any) => message.action === "generateCode",
          ),
        ),
      )
      .toBe(true);
    await page.evaluate(() => {
      const request = (window as any).startupMessages.findLast(
        (message: any) => message.action === "generateCode",
      );
      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            action: "generatedCode",
            data: {
              requestId: request.data.requestId,
              language: "curl",
              variant: "cURL",
              syntax: "shell",
              code: "curl 'https://example.com/a%2Fb'",
              languages: [
                {
                  key: "curl",
                  label: "cURL",
                  syntax_mode: "shell",
                  variants: [{ key: "cURL" }],
                },
                {
                  key: "javascript",
                  label: "JavaScript",
                  syntax_mode: "javascript",
                  variants: [{ key: "Fetch" }],
                },
              ],
            },
          },
        }),
      );
    });
    await expect(page.getByText("cURL(cURL)", { exact: true })).toBeVisible();
    await expect(
      page.locator(".cm-content").filter({ hasText: "a%2Fb" }),
    ).toBeVisible();
    await page.getByText("JavaScript(Fetch)", { exact: true }).click();
    await expect
      .poll(() =>
        page.evaluate(() => {
          const request = (window as any).startupMessages.findLast(
            (message: any) => message.action === "generateCode",
          );
          return [request.data.language, request.data.variant];
        }),
      )
      .toEqual(["javascript", "Fetch"]);
    expect(errors).toEqual([]);
  });
}
