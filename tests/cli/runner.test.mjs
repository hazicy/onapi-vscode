import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, execFileSync } from "node:child_process";
const cli = new URL("../../apps/cli/dist/onapi.js", import.meta.url).pathname;
const run = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, ...args]);
    let stdout = "",
      stderr = "";
    child.stdout.on("data", (data) => (stdout += data));
    child.stderr.on("data", (data) => (stderr += data));
    child.on("error", reject);
    child.on("exit", (code) => resolve({ code, stdout, stderr }));
  });
test("CLI executes collections, selects requests with inherited scripts and emits CI reports", async () => {
  execFileSync(
    process.execPath,
    [new URL("../../apps/cli/build.mjs", import.meta.url).pathname],
    { stdio: "pipe" },
  );
  const directory = await mkdtemp(join(tmpdir(), "onapi-cli-"));
  const hits = [];
  const server = createServer((req, res) => {
    hits.push(req.url);
    if (req.url === "/hang") return;
    res.setHeader("content-type", "application/json");
    res.end('{"ok":true}');
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const file = join(directory, "collection.json");
  const env = join(directory, "env.json");
  const output = join(directory, "report.xml");
  const collection = (script, path = "/ok") => ({
    info: {
      name: "CLI <test>",
      schema:
        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    event: [
      { listen: "test", script: { type: "text/javascript", exec: [script] } },
    ],
    item: [
      {
        name: "folder",
        item: [
          {
            name: "selected",
            request: { method: "GET", url: "{{base}}" + path },
          },
          { name: "other", request: { method: "GET", url: "{{base}}/other" } },
        ],
      },
    ],
  });
  try {
    await writeFile(
      env,
      JSON.stringify({
        values: [
          {
            key: "base",
            value: `http://127.0.0.1:${server.address().port}`,
            enabled: true,
          },
        ],
      }),
    );
    await writeFile(
      file,
      JSON.stringify(
        collection('pm.test("status", () => pm.response.to.have.status(200));'),
      ),
    );
    const passed = await run([
      "run",
      file,
      "--env",
      env,
      "--request",
      "selected",
      "--reporter",
      "json",
    ]);
    assert.equal(passed.code, 0, passed.stderr + passed.stdout);
    const report = JSON.parse(passed.stdout);
    assert.equal(report.summary.requests, 1);
    assert.equal(report.summary.assertions, 1);
    assert.deepEqual(hits, ["/ok"]);
    await writeFile(
      file,
      JSON.stringify(
        collection(
          'pm.test("bad <status>", () => pm.response.to.have.status(201));',
        ),
      ),
    );
    const failed = await run([
      "run",
      file,
      "--env",
      env,
      "--request",
      "selected",
      "--reporter",
      "junit",
      "--output",
      output,
    ]);
    assert.equal(failed.code, 1);
    assert.match(await readFile(output, "utf8"), /failures="1"/);
    assert.match(await readFile(output, "utf8"), /bad &lt;status&gt;/);
    await writeFile(
      file,
      JSON.stringify(collection('throw new Error("script failed");')),
    );
    assert.equal((await run(["run", file, "--env", env])).code, 1);
    await writeFile(file, JSON.stringify(collection("", "/hang")));
    assert.equal(
      (await run(["run", file, "--env", env, "--timeout", "400"])).code,
      1,
    );
    assert.equal((await run(["run", file, "--request", "missing"])).code, 2);
    assert.equal((await run(["run", file, "--output", file])).code, 2);
    assert.equal((await run(["run", file, "--reporter", "invalid"])).code, 2);
    assert.equal((await run(["--help"])).code, 0);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});
