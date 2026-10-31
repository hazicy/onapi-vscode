import * as z from "zod";

export const protocolHeadersSchema = z.record(z.string(), z.string());

export const aiMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});
export const aiConfigSchema = z.object({
  model: z.string().default(""),
  system: z.string().default(""),
  messages: z.array(aiMessageSchema).default([]),
  temperature: z.number().min(0).max(2).default(1),
  maxOutputTokens: z.number().int().positive().default(2048),
  headers: z.record(z.string(), z.string()).default({}),
});
export const mcpConfigSchema = z.object({
  transport: z.enum(["http", "sse", "stdio"]).default("http"),
  headers: z.record(z.string(), z.string()).default({}),
  command: z.string().default(""),
  args: z.array(z.string()).default([]),
});
export const mcpOperationSchema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("tools/list"), cursor: z.string().optional() }),
  z.object({
    method: z.literal("resources/list"),
    cursor: z.string().optional(),
  }),
  z.object({
    method: z.literal("prompts/list"),
    cursor: z.string().optional(),
  }),
  z.object({
    method: z.literal("tools/call"),
    name: z.string().min(1),
    arguments: z.record(z.string(), z.unknown()),
  }),
  z.object({ method: z.literal("resources/read"), uri: z.string().min(1) }),
  z.object({
    method: z.literal("prompts/get"),
    name: z.string().min(1),
    arguments: z.record(z.string(), z.string()),
  }),
]);
export type AiConfig = z.infer<typeof aiConfigSchema>;
export type McpConfig = z.infer<typeof mcpConfigSchema>;

export type McpOperation = z.infer<typeof mcpOperationSchema>;
