import { test, before } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { build } from "esbuild";
import { createRequire } from "node:module";

const extensionRequire = createRequire(
  new URL("../../packages/runtime/package.json", import.meta.url),
);
let handle;
before(async () => {
  await build({
    entryPoints: [
      "apps/extension/src/features/requests/execution/ai-mcp-session.ts",
    ],
    outfile: "test-results/ai-mcp-integration.cjs",
    bundle: true,
    platform: "node",
    format: "cjs",
  });
  handle = createRequire(import.meta.url)(
    "../../test-results/ai-mcp-integration.cjs",
  ).handleAiMcpCommand;
});
function panel() {
  const events = [];
  let dispose;
  return {
    events,
    target: {
      webview: { postMessage: (event) => events.push(event) },
      onDidDispose: (callback) => {
        dispose = callback;
      },
    },
    dispose: () => dispose?.(),
  };
}
async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return `http://127.0.0.1:${server.address().port}`;
}
test("AI SDK sends an OpenAI-compatible chat request and consumes real SSE", async () => {
  let body;
  let authorization;
  const server = createServer(async (req, res) => {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    body = JSON.parse(raw);
    authorization = req.headers.authorization;
    res.writeHead(200, { "Content-Type": "text/event-stream" });
    for (const delta of ["Hello", " world"])
      res.write(
        `data: ${JSON.stringify({ id: "chat-test", object: "chat.completion.chunk", created: 1, model: "fixture", choices: [{ index: 0, delta: { content: delta }, finish_reason: null }] })}\n\n`,
      );
    res.write(
      `data: ${JSON.stringify({ id: "chat-test", object: "chat.completion.chunk", created: 1, model: "fixture", choices: [{ index: 0, delta: {}, finish_reason: "stop" }], usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 } })}\n\n`,
    );
    res.end("data: [DONE]\n\n");
  });
  const url = await listen(server);
  const fixture = panel();
  try {
    await handle(
      {
        action: "ai_send",
        requestId: "actual-ai",
        data: {
          id: "ai",
          url: `${url}/v1`,
          apiKey: "fixture-key",
          config: {
            model: "fixture",
            system: "Be brief",
            messages: [{ role: "user", content: "hello" }],
            temperature: 0,
            maxOutputTokens: 32,
            headers: {},
          },
        },
      },
      fixture.target,
    );
    assert.equal(authorization, "Bearer fixture-key");
    assert.equal(body.stream, true);
    assert.equal(body.messages[0].role, "system");
    assert.equal(
      fixture.events
        .filter((e) => e.data.event.type === "response.chunk")
        .map((e) => e.data.event.text)
        .join(""),
      "Hello world",
    );
    assert.equal(fixture.events.at(-1).data.event.type, "session.closed");
    assert.equal(
      fixture.events.find((e) => e.data.event.type === "response.received").data
        .event.value.usage.outputTokens,
      2,
    );
  } finally {
    fixture.dispose();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
test("MCP SDK initializes a real Streamable HTTP server, discovers and calls a tool", async () => {
  const { McpServer } = extensionRequire(
    "@modelcontextprotocol/sdk/server/mcp.js",
  );
  const { StreamableHTTPServerTransport } = extensionRequire(
    "@modelcontextprotocol/sdk/server/streamableHttp.js",
  );
  const mcp = new McpServer({ name: "fixture", version: "1.0.0" });
  mcp.registerTool(
    "greeting",
    { description: "Return a greeting", inputSchema: {} },
    async () => ({ content: [{ type: "text", text: "Hello MCP" }] }),
  );
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });
  await mcp.connect(transport);
  const server = createServer(async (req, res) => {
    await transport.handleRequest(req, res);
  });
  const url = await listen(server);
  const fixture = panel();
  try {
    await handle(
      {
        action: "mcp_connect",
        requestId: "connect",
        data: {
          id: "mcp",
          url,
          config: { transport: "http", headers: {}, command: "", args: [] },
        },
      },
      fixture.target,
    );
    await waitFor(() =>
      fixture.events.some((e) => e.data.event.type === "connection.opened"),
    );
    await handle(
      {
        action: "mcp_request",
        requestId: "list",
        data: { id: "mcp", operation: { method: "tools/list" } },
      },
      fixture.target,
    );
    assert.equal(
      fixture.events.findLast((e) => e.data.event.type === "response.received")
        .data.event.value.tools[0].name,
      "greeting",
    );
    await handle(
      {
        action: "mcp_request",
        requestId: "call",
        data: {
          id: "mcp",
          operation: { method: "tools/call", name: "greeting", arguments: {} },
        },
      },
      fixture.target,
    );
    assert.equal(
      fixture.events.findLast((e) => e.data.event.type === "response.received")
        .data.event.value.content[0].text,
      "Hello MCP",
    );
    await handle(
      {
        action: "mcp_disconnect",
        requestId: "disconnect",
        data: { id: "mcp" },
      },
      fixture.target,
    );
    assert.equal(
      fixture.events.some((e) => e.data.event.type === "connection.closed"),
      true,
    );
  } finally {
    fixture.dispose();
    await mcp.close();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

async function waitFor(predicate) {
  const deadline = Date.now() + 3000;
  while (!predicate()) {
    if (Date.now() > deadline)
      throw new Error("Timed out waiting for MCP connection");
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}
