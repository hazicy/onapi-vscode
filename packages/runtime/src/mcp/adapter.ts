import { abortable } from "../network/abort";
import { createNetworkClient } from "../network/fetch";
import type { NetworkOptions } from "../network/proxy";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { ExecutionContext, ProtocolAdapter } from "@onapi/core";
import type { McpConfig, McpOperation } from "@onapi/domain/requests/ai-mcp";

export interface McpConnectionRequest {
  url: string;
  config: McpConfig;
  fetch?: typeof globalThis.fetch;
  network?: NetworkOptions;
}

/** A persistent connection is distinct from the individual requests it serves. */
export class McpAdapter implements ProtocolAdapter<McpConnectionRequest> {
  readonly protocol = "mcp" as const;
  private client?: Client;
  private readonly controller = new AbortController();
  private release?: () => void;
  private connected = false;
  async cancel() {
    this.controller.abort();
    this.connected = false;
    try {
      await this.client?.close();
    } finally {
      this.release?.();
    }
  }
  async execute(request: McpConnectionRequest, context: ExecutionContext) {
    if (this.controller.signal.aborted) {
      context.publish({ protocol: this.protocol, type: "connection.closed" });
      return;
    }
    const { config } = request;
    const network = createNetworkClient(request.network, request.fetch);
    const client = (this.client = new Client({
      name: "onapi",
      version: "0.0.6",
    }));
    const closed = new Promise<void>((resolve) => {
      this.release = resolve;
    });
    client.onclose = () => {
      this.connected = false;
      this.release?.();
    };
    try {
      const transport =
        config.transport === "stdio"
          ? new StdioClientTransport({
              command: config.command,
              args: config.args,
            })
          : config.transport === "sse"
            ? new SSEClientTransport(new URL(request.url), {
                requestInit: { headers: config.headers },
                fetch: network.fetch,
              })
            : new StreamableHTTPClientTransport(new URL(request.url), {
                requestInit: { headers: config.headers },
                fetch: network.fetch,
              });
      // SDK requests and pending initialization share the connection's abort signal.
      const initialization = AbortSignal.any([
        this.controller.signal,
        AbortSignal.timeout(30_000),
      ]);
      await abortable(
        client.connect(transport, { signal: initialization, timeout: 30_000 }),
        initialization,
      );
      if (this.controller.signal.aborted) {
        return;
      }
      this.connected = true;
      context.publish({
        protocol: this.protocol,
        type: "connection.opened",
        value: {
          server: client.getServerVersion(),
          capabilities: client.getServerCapabilities(),
        },
      });
      await closed;
    } catch (error) {
      if (!this.controller.signal.aborted) {
        throw error;
      }
    } finally {
      this.connected = false;
      try {
        await client.close();
      } finally {
        await network.close();
        this.client = undefined;
        context.publish({ protocol: this.protocol, type: "connection.closed" });
      }
    }
  }
  async request(
    operation: McpOperation,
    signal: AbortSignal,
  ): Promise<unknown> {
    const client = this.client;
    if (!this.connected || !client) {
      throw new Error("Connect to an MCP server first");
    }
    const options = { signal, timeout: 60_000 };
    switch (operation.method) {
      case "tools/list":
        return client.listTools({ cursor: operation.cursor }, options);
      case "resources/list":
        return client.listResources({ cursor: operation.cursor }, options);
      case "prompts/list":
        return client.listPrompts({ cursor: operation.cursor }, options);
      case "tools/call":
        return client.callTool(
          { name: operation.name, arguments: operation.arguments },
          undefined,
          options,
        );
      case "resources/read":
        return client.readResource({ uri: operation.uri }, options);
      case "prompts/get":
        return client.getPrompt(
          { name: operation.name, arguments: operation.arguments },
          options,
        );
    }
  }
}

export class McpRequestAdapter implements ProtocolAdapter<McpOperation> {
  readonly protocol = "mcp" as const;
  private readonly controller = new AbortController();
  constructor(private readonly connection: McpAdapter) {}
  cancel() {
    this.controller.abort();
  }
  async execute(operation: McpOperation, context: ExecutionContext) {
    try {
      const value = await this.connection.request(
        operation,
        this.controller.signal,
      );
      if (!this.controller.signal.aborted) {
        context.publish({
          protocol: this.protocol,
          type: "response.received",
          value,
        });
        if (
          value &&
          typeof value === "object" &&
          "isError" in value &&
          value.isError
        ) {
          context.publish({
            protocol: this.protocol,
            type: "execution.error",
            error: { message: "MCP tool reported an error" },
          });
        }
      }
    } catch (error) {
      if (!this.controller.signal.aborted) {
        throw error;
      }
    } finally {
      if (this.controller.signal.aborted) {
        context.publish({
          protocol: this.protocol,
          type: "execution.cancelled",
        });
      }
    }
  }
}
