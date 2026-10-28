import * as z from "zod";
import {
  id,
  dictionary,
  itemFields,
  socketParameter,
  httpPanelDefinitionSchema,
  panelDefinitionSchema,
  extensibleObject,
} from "./schemas";

const commandFields = {
  requestId: id.optional(),
  option: dictionary.optional(),
};
const command = <A extends string, S extends z.ZodType>(action: A, data: S) =>
  z.strictObject({ action: z.literal(action), ...commandFields, data });
const read = <A extends string>(action: A) =>
  command(action, z.undefined().optional());
const httpData = z.strictObject({ apiData: httpPanelDefinitionSchema });
const sendFields = { ...commandFields, executionId: id };

export const requestPanelCommandSchema = z.discriminatedUnion("action", [
  command(
    "formatDocument",
    z.strictObject({
      source: z.string().max(5 * 1024 * 1024),
      language: z.string(),
    }),
  ),
  read("getVscodeTheme"),
  read("getApiList"),
  read("getProjectConfig"),
  read("getSystemConfig"),
  read("getDocBaseUrl"),
  z.strictObject({
    action: z.literal("stopSendApi"),
    ...sendFields,
    data: z.undefined().optional(),
  }),
  z.strictObject({
    action: z.literal("sendApi"),
    ...sendFields,
    data: httpPanelDefinitionSchema,
  }),
  z.strictObject({
    action: z.literal("sendSse"),
    ...sendFields,
    data: httpPanelDefinitionSchema,
  }),
  command("saveApiData", panelDefinitionSchema),
  command("updateApiActiveData", panelDefinitionSchema),
  command("openNewWindow", id),
  command("openTagPanelById", id),
  command("openEnv", dictionary.optional()),
  command(
    "setProjectConfig",
    z.strictObject({
      key: id.refine(
        (key) => !["__proto__", "prototype", "constructor"].includes(key),
      ),
      value: z.unknown(),
    }),
  ),
  command("setSystemConfig", dictionary),
  command("createShare", z.strictObject({ id, share_time: z.number() })),
  command(
    "generateCode",
    z.strictObject({
      apiData: httpPanelDefinitionSchema,
      language: z.string().optional(),
      variant: z.string().optional(),
      requestId: id,
    }),
  ),
  command("getCodeHar", httpData),
  command("copyAsCurl", httpData),
  command("exportOpenApiById", z.strictObject({ id })),
  command(
    "getGraphQLSchema",
    z.strictObject({
      apiData: httpPanelDefinitionSchema,
      currentServerId: z.string().optional(),
    }),
  ),
  command(
    "ws_connect",
    z.strictObject({
      option: dictionary.optional(),
      target: extensibleObject({ ...itemFields, kind: z.literal("websocket") }),
    }),
  ),
  command(
    "socketio_connect",
    z.strictObject({
      option: dictionary.optional(),
      target: extensibleObject({ ...itemFields, kind: z.literal("socketio") }),
    }),
  ),
  command("ws_disconnect", id),
  command("socketio_disconnect", id),
  command(
    "ws_send",
    z.strictObject({
      id,
      msg: z.unknown().optional(),
      type: z.string().optional(),
    }),
  ),
  command(
    "socketio_send",
    z.strictObject({
      id,
      event: id,
      msg: z.unknown(),
      is_ack: z.union([z.boolean(), z.number(), z.string()]),
      type: z.string().optional(),
    }),
  ),
  command(
    "socketio_update_event",
    z.strictObject({ id, parameter: z.array(socketParameter) }),
  ),
  command(
    "/proxy/fetch",
    extensibleObject({
      url: id,
      data: z.unknown().optional(),
      headers: dictionary.optional(),
      options: dictionary.optional(),
      method: z.string().optional(),
    }),
  ),
]);
export type RequestPanelCommand = z.infer<typeof requestPanelCommandSchema>;
export type RequestPanelCommandInput = z.input<
  typeof requestPanelCommandSchema
>;
