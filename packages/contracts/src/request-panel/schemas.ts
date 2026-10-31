import * as z from "zod";

export { extensibleObject } from "@onapi/domain/schemas/object";
import { extensibleObject } from "@onapi/domain/schemas/object";
import {
  httpEditorRecordSchema,
  editorRecordSchema,
  recordIdentityFields,
} from "@onapi/domain/requests/record";

export const id = z
  .string()
  .min(1)
  .refine((value) => value.trim().length > 0);
export const dictionary = z.record(z.string(), z.unknown());
// SDK and editor extensions must survive round trips, including auth, scripts,
// examples and protocol-specific metadata. Only the message envelope is strict.
export const sdkObject = z.record(z.string(), z.unknown());
export const socketParameter = extensibleObject({
  key: z.string().optional(),
  value: z.unknown().optional(),
});
export const itemFields = recordIdentityFields;
export const httpPanelDefinitionSchema = httpEditorRecordSchema;
export const panelDefinitionSchema = editorRecordSchema;
export type PanelDefinition = z.infer<typeof panelDefinitionSchema>;

export const panelErrorSchema = extensibleObject({
  message: z.string(),
  code: z.string().optional(),
});
const nativeEvent = extensibleObject({
  error: panelErrorSchema.nullable().optional(),
  type: z.enum([
    "start",
    "beforeItem",
    "request",
    "responseStart",
    "responseData",
    "console",
    "assertion",
    "exception",
    "prerequest",
    "test",
    "item",
    "done",
  ]),
});
const protocolType = z.enum([
  "runtime.event",
  "response.received",
  "response.chunk",
  "assertion.completed",
  "connection.opened",
  "connection.closed",
  "message.received",
  "message.sent",
  "ack.received",
  "subscriptions.updated",
  "execution.error",
]);
const protocol = z.enum(["http", "websocket", "socketio"]);
const resultFields = {
  isSuccess: z.boolean(),
  time: z.string(),
  dataType: z.string(),
  size: z.string(),
};
export const executionEnvelopeSchema = z.strictObject({
  protocolVersion: z.literal(1),
  sessionId: id,
  targetId: z.string().optional(),
  sequence: z.number().int().positive(),
  timestamp: z.number().finite(),
  event: z.union([
    z.strictObject({
      protocol: z.literal("http"),
      type: protocolType,
      native: nativeEvent,
    }),
    z.strictObject({
      protocol: z.literal("websocket"),
      type: protocolType,
      result: extensibleObject({
        ...resultFields,
        type: z.enum(["connection", "message", "send", "error", "close"]),
        message: z.string(),
        contentType: z.string().optional(),
        data: z.unknown().optional(),
      }),
    }),
    z.strictObject({
      protocol: z.literal("socketio"),
      type: protocolType,
      result: extensibleObject({
        ...resultFields,
        type: z.enum([
          "connect",
          "connect_error",
          "disconnect",
          "message",
          "send",
          "send_ack",
          "error",
        ]),
        message: z.union([
          z.string(),
          z.strictObject({ event: z.string(), data: z.unknown() }),
        ]),
      }),
    }),
    z.strictObject({
      protocol: z.literal("socketio"),
      type: z.literal("subscriptions.updated"),
      subscriptions: z.strictObject({
        addedEvents: z.array(z.string()),
        removedEvents: z.array(z.string()),
      }),
    }),
    z.strictObject({
      protocol,
      type: z.enum([
        "session.started",
        "execution.completed",
        "session.closed",
      ]),
      failed: z.boolean(),
    }),
    z.strictObject({
      protocol,
      type: z.literal("execution.error"),
      error: panelErrorSchema,
    }),
  ]),
});
