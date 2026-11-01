# AI provider checks

The AI request contract lives in [ai-mcp.ts](../packages/domain/src/requests/ai-mcp.ts).
Only OpenAI and DeepSeek are supported; no legacy provider migration is performed.

- OpenAI defaults to the Responses API, with Chat Completions selectable in Parameters.
- DeepSeek uses Chat Completions, with automatic, enabled, or disabled thinking.
- Both accept a model ID, system instructions, text conversation, token limit and custom headers.
- Streamed text and reasoning are separate events. Completion reports usage, finish reason, model and duration.
- The dedicated API Key field is transient and isolated by provider. It can contain an environment variable reference such as `{{AI_API_KEY}}`, resolved by the extension host. Custom headers remain part of the saved request, so use variable references for credentials there.
- The Prompt and System prompt editors sit above a resizable conversation log. The prompt draft is saved with the request and remains in the editor after sending.
- Every received assistant turn retains its provider, model, duration, usage, completion time and outcome. Switching the active provider does not relabel old responses.
- Conversation messages, including received reasoning, are saved in the request. Only role and text content are sent back as context; no tools are used.
- Stop retains the partial response. Regenerate replaces the last assistant turn and resends the existing user context. Failures are surfaced without automatic retries.

The fixture uses dummy credentials and follows the documented SSE shapes; it does **not** establish live account access, model availability or billing behavior.
Provider sources and remaining assumptions are in [the simulation context](./simulations/ai-providers.context.yaml).

Run the local simulation in one terminal:

```sh
postman simulation run postman/simulations/ai-providers.sim.yaml --port 4017 --no-history --output ndjson
```

Then run the actual runtime adapter against it:

```sh
node scripts/test-ai-providers.mjs http://127.0.0.1:4017/ai
```

The check exercises Responses, OpenAI Chat Completions, DeepSeek thinking, token usage, HTTP 401/429 and cancellation. The simulation's request log establishes which endpoints were called. No Postman cloud resources are created or published.

Existing regression tests:

```sh
node --experimental-vm-modules --test tests/extension/aiMcpSession.test.mjs tests/extension/aiMcpIntegration.test.mjs
pnpm test:ui apps/webviews/tests/ui/aiMcp.spec.ts
```
