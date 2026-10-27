import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

// Marketplace icons and README images must be raster; SVGs remain the sources.
async function main() {
  const images = path.resolve(
    fileURLToPath(new URL(".", import.meta.url)),
    "../apps/webviews/public/images",
  );
  const svg = await fs.readFile(path.join(images, "onapi-icon.svg"), "utf8");
  // Separate transparent assets also avoid reusing the old README image URL.
  await fs.writeFile(
    path.join(images, "onapi-symbol-light.svg"),
    svg
      .replaceAll(
        "onapi — Marketplace icon",
        "onapi — README icon (light theme)",
      )
      .replaceAll("#FFFFFF", "#17243B")
      .replaceAll("#A9C7FF", "#526FA3")
      .replaceAll("#CAD5E7", "#71839D"),
  );
  await fs.writeFile(
    path.join(images, "onapi-symbol-dark.svg"),
    svg.replaceAll(
      "onapi — Marketplace icon",
      "onapi — README icon (dark theme)",
    ),
  );
  const card = svg
    .replaceAll("onapi — Marketplace icon", "onapi — README card")
    .replace(
      "</title>",
      '</title><defs><clipPath id="card"><rect width="128" height="128" rx="40"/></clipPath></defs><g clip-path="url(#card)"><rect width="128" height="128" rx="40" fill="#17243B"/>',
    )
    .replace("</svg>", "</g></svg>");
  await fs.writeFile(path.join(images, "onapi-readme-card.svg"), card);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 256, height: 256 },
      deviceScaleFactor: 1,
    });
    await page.setContent(
      `<style>html,body{margin:0;background:transparent}svg{display:block;width:256px;height:256px}</style>${svg}`,
    );
    const png = await page.screenshot({ omitBackground: true });
    for (const filename of ["onapi-icon.png", "logo_icon.png"]) {
      await fs.writeFile(path.join(images, filename), png);
    }
    await page.setContent(
      `<style>html,body{margin:0;background:transparent}svg{display:block;width:256px;height:256px}</style>${card}`,
    );
    await page.screenshot({
      path: path.join(images, "onapi-readme-card.png"),
      omitBackground: true,
    });
    const logo = await fs.readFile(path.join(images, "onapi-logo.svg"), "utf8");
    const width = 988;
    const height = 448;
    await page.setViewportSize({ width, height });
    await page.setContent(
      `<style>html,body{margin:0;background:transparent}svg{display:block;width:${width}px;height:${height}px}</style>${logo}`,
    );
    await page.screenshot({
      path: path.join(images, "onapi-logo.png"),
      omitBackground: true,
    });
  } finally {
    await browser.close();
  }
  console.log("Generated onapi PNG icons and README logo from SVG sources.");
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
