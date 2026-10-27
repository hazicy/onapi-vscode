import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const browser = await chromium.launch();
try {
  for (const theme of ["light", "dark"]) {
    const page = await browser.newPage({ colorScheme: theme });
    const svg = await fs.readFile(
      `apps/webviews/public/images/onapi-symbol-${theme}.svg`,
      "utf8",
    );
    await page.setContent(
      `<body style="background:${theme === "light" ? "#fff" : "#0d1117"}"><img width="128" src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}"></body>`,
    );
    await page.locator("img").evaluate((i) => i.decode());
    const alpha = await page.locator("img").evaluate((i) => {
      const c = document.createElement("canvas");
      c.width = 128;
      c.height = 128;
      const ctx = c.getContext("2d");
      ctx.drawImage(i, 0, 0);
      return ctx.getImageData(64, 20, 1, 1).data[3];
    });
    if (alpha !== 0) throw new Error(`${theme} has background`);
    await page.screenshot({ path: `/private/tmp/onapi-icon-${theme}.png` });
    console.log(`${theme}: transparent background verified`);
    await page.close();
  }
} finally {
  await browser.close();
}
