import { createNetworkClient } from "../network/fetch";
import type { NetworkOptions } from "../network/proxy";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createDeepSeek } from "@ai-sdk/deepseek";
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
      const settings = {
        baseURL: request.url,
        // An empty panel key must never fall back to a host environment secret.
        apiKey: request.apiKey || "",
        headers: config.headers,
        fetch: network.fetch,
      };
      const providerId = config.provider;
      const model =
        providerId === "openai"
          ? config.openaiApi === "chat"
            ? createOpenAI(settings).chat(config.model)
            : createOpenAI(settings).responses(config.model)
          : createDeepSeek(settings).chat(config.model);
      const startedAt = performance.now();
      const result = streamText({
        model,
        maxRetries: 0,
        // Errors are relayed through fullStream; avoid the SDK logging prompts.
        onError: () => {},
        providerOptions:
          providerId === "deepseek" &&
          config.thinking &&
          config.thinking !== "auto"
            ? { deepseek: { thinking: { type: config.thinking } } }
            : providerId === "openai"
              ? { openai: { store: false } }
              : undefined,
        system: config.system || undefined,
        messages: config.messages.map(({ role, content }) => ({
          role,
          content,
        })),
        temperature: config.temperature,
        maxOutputTokens: config.maxOutputTokens,
        abortSignal: this.controller.signal,
        timeout: { totalMs: 300_000, chunkMs: 60_000 },
      });
      for await (const part of result.fullStream) {
        if (part.type === "text-delta" || part.type === "reasoning-delta") {
          context.publish({
            protocol: this.protocol,
            type: "response.chunk",
            text: part.text,
            ...(part.type === "reasoning-delta"
              ? { channel: "reasoning" as const }
              : {}),
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
            durationMs: Math.round(performance.now() - startedAt),
            model: config.model,
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
