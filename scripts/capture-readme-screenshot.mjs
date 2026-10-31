import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const root = fileURLToPath(new URL("../", import.meta.url));
const { values } = parseArgs({
  options: {
    cdp: { type: "string", default: "http://127.0.0.1:9333" },
    output: { type: "string", default: "docs/assets/onapi-vscode.png" },
  },
});
const browser = await chromium.connectOverCDP(values.cdp);
try {
  const page = browser
    .contexts()
    .flatMap((context) => context.pages())
    .find((candidate) => candidate.url().includes("workbench.html"));
  if (!page) throw new Error("No VS Code workbench found at the CDP endpoint.");
  await page.setViewportSize({ width: 1600, height: 1020 });
  const sidebar = page.locator('[id="workbench.parts.sidebar"]');
  await sidebar.waitFor({ state: "visible" });
  // Electron's nested Webview targets attach after the workbench target.
  await page.waitForTimeout(1500);
  await page.mouse.move(5, 5);
  const output = path.resolve(root, values.output);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await page.screenshot({ path: output });
  await sidebar.screenshot({
    path: path.join(root, "docs/assets/onapi-native-sidebar.png"),
  });
  console.log(`Captured ${output}`);
} finally {
  // Disconnect; leave the running VS Code window open.
  await browser.close();
}
