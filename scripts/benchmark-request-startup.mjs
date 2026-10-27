import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { chromium } from "@playwright/test";

// Reuse the production startup regression's representative HTTP request data.
const fixture = await fs.readFile(
  "apps/webviews/tests/ui/startup.spec.ts",
  "utf8",
);
const html = fixture.match(/body: `([\s\S]*?)`,\n/)[1];
const server = http.createServer(async (req, res) => {
  try {
    const file = path.resolve(
      "dist",
      `.${new URL(req.url, "http://localhost").pathname}`,
    );
    if (!file.startsWith(path.resolve("dist") + path.sep))
      throw new Error("Invalid path");
    const body = await fs.readFile(file);
    res.setHeader(
      "Content-Type",
      file.endsWith(".js")
        ? "text/javascript"
        : file.endsWith(".css")
          ? "text/css"
          : "application/octet-stream",
    );
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch();
  const samples = [];
  for (let run = 0; run < 10; run++) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const session = await context.newCDPSession(page);
    await session.send("Performance.enable");
    await page.route("**/startup.html", (route) =>
      route.fulfill({ contentType: "text/html", body: html }),
    );
    await page.goto(`${origin}/startup.html`);
    await page
      .getByPlaceholder("Enter URL or paste cURL text")
      .waitFor({ state: "visible" });
    await page.waitForFunction(
      () => performance.getEntriesByName("onapi:content-painted").length > 0,
    );
    const metrics = await session.send("Performance.getMetrics");
    await page.waitForLoadState("networkidle");
    samples.push(
      await page.evaluate(
        (metrics) => ({
          measures: Object.fromEntries(
            performance
              .getEntriesByType("measure")
              .filter((x) => x.name.startsWith("onapi:"))
              .map((x) => [x.name, x.duration]),
          ),
          marks: Object.fromEntries(
            performance
              .getEntriesByType("mark")
              .filter((x) => x.name.startsWith("onapi:"))
              .map((x) => [x.name, x.startTime]),
          ),
          resources: performance
            .getEntriesByType("resource")
            .filter((x) => /\.(js|css)$/.test(new URL(x.name).pathname))
            .map((x) => ({
              file: new URL(x.name).pathname,
              bytes: x.decodedBodySize,
              start: x.startTime,
              duration: x.duration,
            })),
          cpu: Object.fromEntries(
            metrics.metrics
              .filter((x) =>
                [
                  "ScriptDuration",
                  "TaskDuration",
                  "LayoutDuration",
                  "RecalcStyleDuration",
                ].includes(x.name),
              )
              .map((x) => [x.name, x.value * 1000]),
          ),
        }),
        metrics,
      ),
    );
    await context.close();
  }
  const summary = {};
  for (const group of ["measures", "cpu"]) {
    summary[group] = {};
    for (const name of Object.keys(samples[0][group])) {
      const values = samples.map((x) => x[group][name]).sort((a, b) => a - b);
      summary[group][name] = {
        median: (values[4] + values[5]) / 2,
        min: values[0],
        max: values[9],
        p90: values[8],
      };
    }
  }
  summary.phases = {};
  for (const [name, start, end] of [
    ["html-to-data", "html-ready", "data-ready"],
    ["protocol-load", "protocol-start", "protocol-ready"],
    ["protocol-ready-to-commit", "protocol-ready", "content-ready"],
    ["commit-to-paint", "content-ready", "content-painted"],
  ]) {
    const values = samples
      .map((x) => x.marks[`onapi:${end}`] - x.marks[`onapi:${start}`])
      .sort((a, b) => a - b);
    summary.phases[name] = {
      median: (values[4] + values[5]) / 2,
      min: values[0],
      max: values[9],
    };
  }
  const report = {
    note: "10 isolated Chromium contexts, production build, localhost, immediate mocked host, HTTP empty request. Paint opportunity via double rAF; excludes VS Code panel creation and physical click dispatch. CPU metrics sampled near paint; resources sampled after network idle.",
    summary,
    samples,
  };
  await fs.mkdir("test-results", { recursive: true });
  await fs.writeFile(
    "test-results/request-startup-benchmark.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser?.close();
  server.close();
}
