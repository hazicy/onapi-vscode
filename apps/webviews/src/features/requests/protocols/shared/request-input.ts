import {
  protocolHeadersSchema,
  aiConfigSchema,
  mcpConfigSchema,
  mcpOperationSchema,
} from "@onapi/domain/requests/ai-mcp";
import type {
  AiEditorRecord,
  McpEditorRecord,
} from "@onapi/domain/requests/record";
const headers = protocolHeadersSchema;
export function parseAiConfig(record: AiEditorRecord) {
  return aiConfigSchema.parse({
    ...record.ai,
    headers:
      record.draft?.headersText === undefined
        ? record.ai.headers
        : headers.parse(JSON.parse(record.draft.headersText)),
  });
}
export function parseMcpConfig(record: McpEditorRecord) {
  return mcpConfigSchema.parse({
    ...record.mcp,
    headers:
      record.draft?.headersText === undefined
        ? record.mcp.headers
        : headers.parse(JSON.parse(record.draft.headersText)),
    args:
      record.draft?.argsText === undefined
        ? record.mcp.args
        : JSON.parse(record.draft.argsText),
  });
}
export function mcpInput(record: McpEditorRecord) {
  const operation = record.mcpOperation;
  return {
    method: record.draft?.method ?? operation?.method ?? "tools/list",
    name:
      record.draft?.name ??
      (operation && "name" in operation
        ? operation.name
        : operation && "uri" in operation
          ? operation.uri
          : ""),
    argumentsText:
      record.draft?.argumentsText ??
      JSON.stringify(
        operation && "arguments" in operation ? operation.arguments : {},
        null,
        2,
      ),
  };
}
export function parseMcpOperation(record: McpEditorRecord, cursor?: string) {
  const input = mcpInput(record);
  return mcpOperationSchema.parse({
    method: input.method,
    name: input.name,
    uri: input.name,
    arguments: JSON.parse(input.argumentsText),
    cursor,
  });
}
