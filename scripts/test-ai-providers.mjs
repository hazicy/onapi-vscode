import assert from "node:assert/strict";
import { build } from "esbuild";

const baseURL = process.argv[2];
if (!baseURL)
  throw new Error(
    "Usage: node scripts/test-ai-providers.mjs http://127.0.0.1:4017/ai",
  );
const result = await build({
  stdin: {
    contents: "export { AiAdapter } from './packages/runtime/src/ai/adapter';",
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
});
// Execute the bundle without introducing a runtime build dependency for this check.
const { createRequire } = await import("node:module");
const module = { exports: {} };
new Function("module", "exports", "require", result.outputFiles[0].text)(
  module,
  module.exports,
  createRequire(import.meta.url),
);
const { AiAdapter } = module.exports;
const config = (provider, openaiApi = "responses", model = "fixture") => ({
  provider,
  openaiApi,
  model,
  thinking: "enabled",
  system: "Be brief",
  messages: [{ role: "user", content: "Hello" }],
  maxOutputTokens: 32,
  headers: {},
});
for (const [provider, api] of [
  ["openai", "responses"],
  ["openai", "chat"],
  ["deepseek", "chat"],
]) {
  const events = [];
  await new AiAdapter().execute(
    { url: baseURL, apiKey: "fixture-key", config: config(provider, api) },
    { publish: (event) => events.push(event) },
  );
  assert.equal(
    events
      .filter((e) => e.type === "response.chunk" && e.channel !== "reasoning")
      .map((e) => e.text)
      .join(""),
    "Hello world",
  );
  assert.equal(
    events.find((e) => e.type === "response.received").value.usage.totalTokens,
    5,
  );
  if (provider === "deepseek")
    assert.equal(
      events.find((e) => e.channel === "reasoning").text,
      "Let me think.",
    );
  console.log(
    `PASS ${provider} ${api}: stream, usage${provider === "deepseek" ? ", reasoning" : ""}`,
  );
}
for (const provider of ["openai", "deepseek"]) {
  for (const [model, status] of [
    ["fixture-unauthorized", 401],
    ["fixture-rate-limit", 429],
  ]) {
    await assert.rejects(
      new AiAdapter().execute(
        {
          url: baseURL,
          apiKey: "fixture-key",
          config: config(provider, "responses", model),
        },
        { publish() {} },
      ),
      (error) => error.statusCode === status,
    );
    console.log(`PASS ${provider}: HTTP ${status} surfaced`);
  }
}
const adapter = new AiAdapter();
const events = [];
await adapter.execute(
  {
    url: baseURL,
    apiKey: "fixture-key",
    config: config("deepseek", "chat", "fixture-slow"),
  },
  {
    publish(event) {
      events.push(event);
      if (event.type === "response.chunk" && event.channel !== "reasoning")
        adapter.cancel();
    },
  },
);
assert(events.some((event) => event.type === "execution.cancelled"));
assert(!events.some((event) => event.type === "response.received"));
console.log(
  "PASS cancellation retains partial chunks and emits cancelled without success",
);
