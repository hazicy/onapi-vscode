import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const root = fileURLToPath(new URL("../", import.meta.url));
const { values } = parseArgs({
  options: {
    cdp: { type: "string" },
    sidebar: { type: "string" },
    output: {
      type: "string",
      default: "apps/webviews/public/images/onapi-preview.png",
    },
    help: { type: "boolean" },
  },
});
if (values.help) {
  console.log(`Usage: node scripts/generate-readme-preview.mjs [options]
  --cdp URL        Capture sidebar from a running VS Code debugging endpoint
  --sidebar PATH   Use a native sidebar screenshot (default: docs/assets/onapi-native-sidebar.png)
  --output PATH    Output PNG, relative to the repository or absolute

Build webviews first. See scripts/README.md for launching an isolated VS Code.
The output has a transparent background, simulated window/activity bar,
and a real native tree plus the real request editor with sample response data.`);
  process.exit(0);
}
const images = path.join(root, "apps/webviews/public/images");
const dist = path.join(root, "apps/webviews/dist");
const output = path.resolve(root, values.output);
const dataUrl = (data, mime = "image/png") =>
  `data:${mime};base64,${data.toString("base64")}`;

async function captureSidebar() {
  if (!values.cdp)
    return fs.readFile(
      path.resolve(
        root,
        values.sidebar || "docs/assets/onapi-native-sidebar.png",
      ),
    );
  let vscode;
  try {
    vscode = await chromium.connectOverCDP(values.cdp);
    const page = vscode
      .contexts()
      .flatMap((context) => context.pages())
      .find((candidate) => candidate.url().includes("workbench.html"));
    if (!page)
      throw new Error("No VS Code workbench found at the CDP endpoint.");
    const sidebar = page.locator('[id="workbench.parts.sidebar"]');
    await sidebar.waitFor({ state: "visible" });
    const screenshot = await sidebar.screenshot();
    await fs.mkdir(path.join(root, "artifacts"), { recursive: true });
    await fs.writeFile(
      path.join(root, "artifacts/onapi-native-sidebar.png"),
      screenshot,
    );
    return screenshot;
  } finally {
    // Disconnect from the user's instance; do not close its window.
    await vscode?.close();
  }
}

async function captureEditor(browser) {
  await fs.access(path.join(dist, "tagPanel.js"));
  const page = await browser.newPage({
    viewport: { width: 1088, height: 843 },
    deviceScaleFactor: 2,
  });
  const initialData = {
    projectConfig: {},
    systemConfig: { raw_parameter_pilot_bubble_switch: false },
    vscodeTheme: "Default Dark Modern",
    docBaseUrl: "",
    apiData: {
      id: "readme-preview",
      kind: "api",
      project_id: "-1",
      parentId: "0",
      name: "List projects",
      request: {
        method: "GET",
        url: {
          raw: "https://api.example.com/v1/projects?limit=10",
          query: [{ key: "limit", value: "10" }],
        },
        header: [{ key: "Accept", value: "application/json" }],
        auth: { type: "noauth" },
      },
      event: [],
      response: [],
    },
  };
  const colors = {
    foreground: "#cccccc",
    "icon-foreground": "#aaaaaa",
    "button-background": "#0078d4",
    "button-foreground": "#ffffff",
    "editor-background": "#111111",
    "sideBar-background": "#181818",
    "settings-headerBorder": "#292929",
    "settings-focusedRowBackground": "#202020",
    "toolbar-hoverBackground": "#282828",
    "gitDecoration-ignoredResourceForeground": "#777777",
    "input-placeholderForeground": "#777777",
    "input-background": "#181818",
    "input-foreground": "#cccccc",
    "editorWidget-border": "#303030",
    focusBorder: "#0078d4",
  };
  const variables = Object.entries(colors)
    .map(([key, value]) => `--vscode-${key}:${value}`)
    .join(";");
  await page.route("http://preview.local/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/preview.html") {
      return route.fulfill({
        contentType: "text/html",
        body: `<!doctype html><html lang="en" style="${variables}"><head><link rel="stylesheet" href="/webviews.css"><style>html,body{margin:0;background:#111;font-family:Arial,sans-serif}</style></head><body><div id="root"></div><script>window.resourceBaseUrl=location.origin;window.vscodeData=${JSON.stringify({ kind: "api", initialData })};window.vscode={postMessage(m){if(m.action==='getApiList')window.dispatchEvent(new MessageEvent('message',{data:{action:'setApiList',data:[]}}))}};</script><script type="module" src="/tagPanel.js"></script></body></html>`,
      });
    }
    const asset = path.resolve(dist, `.${decodeURIComponent(pathname)}`);
    if (!asset.startsWith(`${dist}${path.sep}`)) return route.abort();
    try {
      await route.fulfill({ path: asset });
    } catch {
      await route.abort();
    }
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://preview.local/preview.html");
  await page.getByPlaceholder("Enter URL or paste cURL text").waitFor();
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => {
    let sequence = 0;
    const emit = (event) =>
      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            action: "protocolExecutionEvent",
            data: {
              protocolVersion: 1,
              targetId: "readme-preview",
              sessionId: "readme",
              sequence: ++sequence,
              timestamp: Date.now(),
              event: { protocol: "http", ...event },
            },
          },
        }),
      );
    const response = {
      code: 200,
      status: "OK",
      responseTime: 42,
      header: [{ key: "content-type", value: "application/json" }],
      stream: {
        type: "Buffer",
        data: Array.from(
          new TextEncoder().encode(
            JSON.stringify(
              {
                data: [
                  {
                    id: "prj_01",
                    name: "OnAPI",
                    status: "active",
                    protocols: ["HTTP", "GraphQL", "WebSocket"],
                  },
                  {
                    id: "prj_02",
                    name: "Public API",
                    status: "active",
                    protocols: ["HTTP", "SSE"],
                  },
                ],
                pagination: { limit: 10, total: 2 },
              },
              null,
              2,
            ),
          ),
        ),
      },
    };
    emit({ type: "session.started", failed: false });
    for (const native of [
      { type: "start" },
      {
        type: "request",
        request: {
          method: "GET",
          url: "https://api.example.com/v1/projects?limit=10",
          header: [],
        },
        response,
      },
      { type: "done", error: null },
    ])
      emit({ type: "runtime.event", native });
  });
  await page.getByRole("button", { name: "Toggle word wrap" }).waitFor();
  for (const separator of await page.locator('[role="separator"]').all()) {
    const box = await separator.boundingBox();
    if (!box || box.width < 500) continue;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, 280, { steps: 12 });
    await page.mouse.up();
    break;
  }
  await page.waitForTimeout(500);
  if (errors.length)
    throw new Error(`Editor rendering errors: ${errors.join("; ")}`);
  const screenshot = await page.screenshot();
  await page.close();
  return screenshot;
}

async function main() {
  const sidebar = await captureSidebar();
  const browser = await chromium.launch({ headless: true });
  try {
    const editor = await captureEditor(browser);
    const logo = await fs.readFile(path.join(images, "onapi-activity.svg"));
    const page = await browser.newPage({
      viewport: { width: 1600, height: 1048 },
      deviceScaleFactor: 2,
    });
    const icon = (paths) => `<svg viewBox="0 0 24 24">${paths}</svg>`;
    await page.setContent(`<!doctype html><html><head><style>
      *{box-sizing:border-box}body{margin:0;width:1600px;height:1048px;display:flex;align-items:center;justify-content:center;background:transparent;font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif}
      .window{width:1442px;border:1px solid #303030;border-radius:18px;overflow:hidden;box-shadow:0 30px 70px #0008}.bar{height:44px;background:#181818;color:#bcbcbc;display:flex;align-items:center;padding:0 18px;gap:8px;font-size:12px;border-bottom:1px solid #292929}.dot{width:10px;height:10px;border-radius:50%;background:#ff6961}.dot:nth-child(2){background:#f5c451}.dot:nth-child(3){background:#5fc98b}.title{margin-left:18px;letter-spacing:.4px}
      .content{display:flex;height:843px;background:#181818}.activity{width:48px;flex-shrink:0;background:#181818;border-right:1px solid #292929;display:flex;align-items:center;flex-direction:column;gap:24px;padding:19px 0;color:#868686}.activity svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.5}.active{width:48px;border-left:2px solid #d0d0d0;background:#282828;display:flex;justify-content:center;padding:11px 0}.active img{width:24px;height:24px}.spacer{flex:1}.sidebar{width:304px;height:843px;object-fit:fill}.editor{width:1088px;height:843px}img{display:block}
      </style></head><body><div class="window"><div class="bar"><i class="dot"></i><i class="dot"></i><i class="dot"></i><span class="title">OnAPI · Visual Studio Code</span></div><div class="content"><div class="activity">
      ${icon('<path d="M6 3h8l4 4v14H6zM14 3v5h5"/>')}${icon('<circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/>')}${icon('<circle cx="7" cy="5" r="2"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="7" r="2"/><path d="M7 7v10m2-4c7 0 9-2 9-4"/>')}
      <div class="active"><img src="${dataUrl(logo, "image/svg+xml")}"></div><div class="spacer"></div>${icon('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="9" r="3"/><path d="M6 18q6-7 12 0"/>')}${icon('<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>')}
      </div><img class="sidebar" src="${dataUrl(sidebar)}"><img class="editor" src="${dataUrl(editor)}"></div></div></body></html>`);
    await page
      .locator("img")
      .evaluateAll((elements) =>
        Promise.all(elements.map((element) => element.decode())),
      );
    await fs.mkdir(path.dirname(output), { recursive: true });
    await page.screenshot({ path: output, omitBackground: true });
    console.log(`Generated ${output}`);
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
