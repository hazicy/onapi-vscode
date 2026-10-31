import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "docs/assets/onapi-protocols.png");
const asset = async (name) =>
  `data:image/svg+xml;base64,${(await fs.readFile(path.join(root, "apps/webviews/public/images", name))).toString("base64")}`;
const protocols = [
  ["HTTP", "http-get-dark.svg", "#8ddbb5", "REST · SSE"],
  ["GraphQL", "graphql-dark.svg", "#eda7ce", "Queries · Mutations"],
  ["gRPC", "grpc-dark.svg", "#8dd9d1", "Unary · Streaming"],
  ["WebSocket", "websocket-dark.svg", "#c9b0fa", "Live messages"],
  ["Socket.IO", "socketio-dark.svg", "#d9dce4", "Events · Acks"],
  ["AI", "ai-dark.svg", "#a7c8ff", "Chat · Streaming"],
  ["MCP", "mcp-dark.svg", "#e2c593", "Tools · Resources · Prompts"],
];
const cards = await Promise.all(
  protocols.map(
    async ([name, icon, color, label]) => `
<article style="--accent:${color}"><div class="icon"><img src="${await asset(icon)}" alt="" /></div><h2>${name}</h2><p>${label}</p></article>`,
  ),
);
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;background:#0c1017;color:#f1f4fa;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;-webkit-font-smoothing:antialiased}
main{position:relative;width:1600px;height:960px;padding:68px 76px;background:radial-gradient(ellipse at 80% 0%,#28466a44,transparent 54%),radial-gradient(ellipse at 10% 100%,#245c4829,transparent 50%);overflow:hidden}
header{display:flex;align-items:center;gap:13px;font-size:25px;font-weight:600;letter-spacing:-.6px}header img{width:38px;height:38px}h1{font-size:78px;line-height:1.06;letter-spacing:-4px;font-weight:550;margin:42px 0 48px}h1 span{color:#8f9db0}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}article{height:242px;border:1px solid #ffffff16;border-radius:22px;padding:29px 30px;background:linear-gradient(135deg,#ffffff06,#ffffff02);position:relative;overflow:hidden}article:after{content:"";position:absolute;width:150px;height:150px;background:var(--accent);filter:blur(65px);opacity:.08;right:-40px;top:-45px}.icon{width:58px;height:58px;display:grid;place-items:center;border-radius:16px;background:color-mix(in srgb,var(--accent) 9%,transparent);border:1px solid color-mix(in srgb,var(--accent) 20%,transparent)}.icon img{width:34px;height:34px}h2{font-size:32px;letter-spacing:-.8px;font-weight:550;margin:23px 0 9px;color:var(--accent)}p{font-size:17px;color:#98a5b6;margin:0}.signature{display:flex;align-items:center;justify-content:center;border:none;background:none}.signature img{width:146px;height:146px;opacity:.18}
</style><main><header><img src="${await asset("onapi-activity.svg")}" alt=""/>OnAPI</header><h1>Every request.<br><span>One workspace.</span></h1><section class="grid">${cards.join("")}<article class="signature"><img src="${await asset("onapi-activity.svg")}" alt=""/></article></section></main></html>`;
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 960 },
    deviceScaleFactor: 2,
  });
  await page.setContent(html);
  await page
    .locator("img")
    .evaluateAll((elements) =>
      Promise.all(elements.map((element) => element.decode())),
    );
  await fs.mkdir(path.dirname(output), { recursive: true });
  await page.screenshot({ path: output });
  console.log(`Generated ${output}`);
} finally {
  await browser.close();
}
