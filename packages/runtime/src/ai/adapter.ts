import { createNetworkClient } from "../network/fetch";
import type { NetworkOptions } from "../network/proxy";
import { streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { ExecutionContext, ProtocolAdapter } from "@onapi/core";
import type { AiConfig } from "@onapi/domain/requests/ai-mcp";

export interface AiExecutionRequest {
  url: string;
  apiKey?: string;
  config: AiConfig;
  fetch?: typeof globalThis.fetch;
  network?: NetworkOptions;
}

/** One generation owns its controller; no editor or persistence dependencies. */
export class AiAdapter implements ProtocolAdapter<AiExecutionRequest> {
  readonly protocol = "ai" as const;
  private readonly controller = new AbortController();
  cancel() {
    this.controller.abort();
  }
  async execute(request: AiExecutionRequest, context: ExecutionContext) {
    const { config } = request;
    const network = createNetworkClient(request.network, request.fetch);
    try {
      if (this.controller.signal.aborted) {
        return;
      }
      if (!config.model.trim()) {
        throw new Error("Model is required");
      }
      const provider = createOpenAICompatible({
        name: "onapi",
        baseURL: request.url,
        apiKey: request.apiKey || undefined,
        headers: config.headers,
        includeUsage: true,
        fetch: network.fetch,
      });
      const result = streamText({
        model: provider(config.model),
        system: config.system || undefined,
        messages: config.messages,
        temperature: config.temperature,
        maxOutputTokens: config.maxOutputTokens,
        abortSignal: this.controller.signal,
        timeout: { totalMs: 300_000, chunkMs: 60_000 },
      });
      for await (const part of result.fullStream) {
        if (part.type === "text-delta") {
          context.publish({
            protocol: this.protocol,
            type: "response.chunk",
            text: part.text,
          });
        }
        if (part.type === "error") {
          throw part.error;
        }
      }
      if (!this.controller.signal.aborted) {
        const usage = await result.usage;
        context.publish({
          protocol: this.protocol,
          type: "response.received",
          value: {
            usage: {
              inputTokens: usage.inputTokens,
              outputTokens: usage.outputTokens,
              totalTokens: usage.totalTokens,
            },
            finishReason: await result.finishReason,
          },
        });
      }
    } catch (error) {
      if (!this.controller.signal.aborted) {
        throw error;
      }
    } finally {
      await network.close();
      if (this.controller.signal.aborted) {
        context.publish({
          protocol: this.protocol,
          type: "execution.cancelled",
        });
      }
    }
  }
}
