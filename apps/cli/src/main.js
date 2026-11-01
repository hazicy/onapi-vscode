import { parseArgs } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { HttpAdapter } from "@onapi/runtime/http/adapter";

const help = `Usage: onapi run <collection.json> [options]

Run a Postman v2.1 collection (including HTTP and GraphQL requests).
  --env <file>            Postman environment JSON
  --request <name-or-id>  Execute one uniquely named request or request ID
  --reporter <format>     cli (default), json, junit
  --output <file>         Write the report to a file instead of stdout
  --timeout <ms>          Overall run deadline (default 60000)
  --help                 Show help

Exit codes: 0 passed, 1 assertions/execution failed, 2 invalid input.
Environment changes stay in memory. Reports omit request bodies and credentials.
`;
const xml = (value) =>
  String(value)
    .replace(
      /[<>&"']/g,
      (c) =>
        ({
          "<": "&lt;",
          ">": "&gt;",
          "&": "&amp;",
          '"': "&quot;",
          "'": "&apos;",
        })[c],
    )
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
const readJson = async (file) =>
  JSON.parse(await readFile(resolve(file), "utf8"));

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      env: { type: "string" },
      request: { type: "string" },
      reporter: { type: "string", default: "cli" },
      output: { type: "string" },
      timeout: { type: "string", default: "60000" },
      help: { type: "boolean" },
    },
  });
  if (values.help || positionals.length === 0) {
    process.stdout.write(help);
    return;
  }
  if (positionals[0] !== "run" || positionals.length !== 2) {
    throw new Error("Expected: onapi run <collection.json>");
  }
  if (!["cli", "json", "junit"].includes(values.reporter)) {
    throw new Error("Unknown reporter");
  }
  const timeout = Number(values.timeout);
  if (!Number.isSafeInteger(timeout) || timeout <= 0 || timeout > 2147483647) {
    throw new Error("Timeout must be a positive integer up to 2147483647");
  }
  const collection = await readJson(positionals[1]);
  if (!collection?.info || !Array.isArray(collection.item)) {
    throw new Error("Expected a Postman collection with info and item fields");
  }
  if (
    values.output &&
    [positionals[1], values.env]
      .filter(Boolean)
      .some((file) => resolve(file) === resolve(values.output))
  ) {
    throw new Error("Output must not overwrite an input file");
  }
  const options = { timeout: { request: timeout, script: timeout } };
  if (values.env) {
    const environment = await readJson(values.env);
    if (!environment || !Array.isArray(environment.values)) {
      throw new Error("Environment must contain a values array");
    }
    options.environment = environment;
  }
  if (values.request) {
    const matches = [];
    const visit = (items) => {
      for (const item of items) {
        if (Array.isArray(item.item)) {
          visit(item.item);
        } else if (
          item.request &&
          (item.name === values.request || item.id === values.request)
        ) {
          matches.push(item);
        }
      }
    };
    visit(collection.item);
    if (matches.length !== 1) {
      throw new Error(`Expected one matching request; found ${matches.length}`);
    }
    // Keep the collection and folder hierarchy so inherited auth/scripts still run.
    matches[0].id ||= "onapi-cli-selected-request";
    options.entrypoint = { execute: matches[0].id };
  }
  const report = {
    collection: collection.info.name || "Collection",
    requests: [],
    assertions: [],
    errors: [],
  };
  const adapter = new HttpAdapter(new URL("./worker.js", import.meta.url));
  let interrupted = false;
  const stop = () => {
    interrupted = true;
    adapter.cancel();
  };
  const timer = setTimeout(() => {
    report.errors.push("Run deadline exceeded");
    adapter.cancel();
  }, timeout);
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  try {
    await adapter.execute(
      { collection, options },
      {
        sessionId: "cli",
        publish({ native: event }) {
          if (event.error) {
            report.errors.push(event.error.message || String(event.error));
          }
          if (event.type === "request") {
            report.requests.push({
              name: event.item?.name || "Request",
              code: event.response?.code,
              responseTime: event.response?.responseTime,
            });
          }
          if (event.type === "assertion") {
            for (const assertion of event.assertions || []) {
              report.assertions.push({
                name: assertion.assertion || assertion.name || "Assertion",
                skipped: !!assertion.skipped,
                error: assertion.error?.message,
              });
            }
          }
          if (["test", "prerequest"].includes(event.type)) {
            for (const result of event.results || []) {
              if (result.result?.error) {
                report.errors.push(
                  result.result.error.message || String(result.result.error),
                );
              }
            }
          }
        },
      },
    );
  } catch (error) {
    report.errors.push(error.message);
  } finally {
    clearTimeout(timer);
    process.removeListener("SIGINT", stop);
    process.removeListener("SIGTERM", stop);
  }
  if (interrupted) {
    report.errors.push("Run interrupted");
  }
  const failed = report.assertions.filter((a) => a.error && !a.skipped).length;
  report.summary = {
    requests: report.requests.length,
    assertions: report.assertions.length,
    failed,
    errors: report.errors.length,
  };
  let output;
  if (values.reporter === "json") {
    output = JSON.stringify(report, null, 2);
  } else if (values.reporter === "junit") {
    const cases = report.assertions.map(
      (a) =>
        `<testcase name="${xml(a.name)}">${a.skipped ? "<skipped/>" : a.error ? `<failure message="${xml(a.error)}"/>` : ""}</testcase>`,
    );
    for (const error of report.errors) {
      cases.push(
        `<testcase name="execution"><error message="${xml(error)}"/></testcase>`,
      );
    }
    if (cases.length === 0) {
      for (const request of report.requests) {
        cases.push(`<testcase name="${xml(request.name)}"/>`);
      }
    }
    output = `<?xml version="1.0" encoding="UTF-8"?>\n<testsuite name="${xml(report.collection)}" tests="${cases.length}" failures="${failed}" errors="${report.errors.length}" skipped="${report.assertions.filter((a) => a.skipped).length}">${cases.join("")}</testsuite>`;
  } else {
    output = `${report.collection}: ${report.requests.length} requests, ${report.assertions.length} assertions, ${failed} failed, ${report.errors.length} errors\n${[...report.assertions.filter((a) => a.error).map((a) => `${a.name}: ${a.error}`), ...report.errors].join("\n")}`;
  }
  if (values.output) {
    await writeFile(resolve(values.output), `${output}\n`);
  } else {
    process.stdout.write(`${output}\n`);
  }
  process.exitCode = interrupted ? 130 : failed || report.errors.length ? 1 : 0;
}
main().catch((error) => {
  process.stderr.write(`onapi: ${error.message}\n`);
  process.exitCode = 2;
});
