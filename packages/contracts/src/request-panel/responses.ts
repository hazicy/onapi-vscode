import * as z from "zod";
import {
  id,
  dictionary,
  sdkObject,
  panelDefinitionSchema,
  panelErrorSchema,
  executionEnvelopeSchema,
  extensibleObject,
} from "./schemas";

const response = <A extends string, S extends z.ZodType>(action: A, data: S) =>
  z.strictObject({ action: z.literal(action), requestId: id.optional(), data });
const fetchResult = extensibleObject({
  code: z.number(),
  data: z.unknown().optional(),
  error: z.unknown().optional(),
});
export const requestPanelResponseSchema = z.discriminatedUnion("action", [
  response("documentFormatted", z.strictObject({ value: z.string() })),
  response("protocolExecutionEvent", executionEnvelopeSchema),
  response(
    "requestSaved",
    z.strictObject({
      definition: panelDefinitionSchema,
      submitted: panelDefinitionSchema,
    }),
  ),
  response(
    "requestPanelError",
    z.strictObject({
      action: z.string().optional(),
      executionId: id.optional(),
      targetId: id.optional(),
      error: panelErrorSchema,
    }),
  ),
  response(
    "generatedCode",
    z.union([
      z.strictObject({ requestId: id, error: z.string() }),
      z.strictObject({
        requestId: id,
        code: z.string(),
        languages: z.array(
          z.object({
            key: z.string(),
            label: z.string(),
            syntax_mode: z.string(),
            variants: z.array(z.object({ key: z.string() })),
          }),
        ),
        language: z.string(),
        variant: z.string(),
        syntax: z.string(),
      }),
    ]),
  ),
  response("setApiList", z.array(panelDefinitionSchema)),
  response("externalStorageChanged", z.array(panelDefinitionSchema)),
  response("setApiData", panelDefinitionSchema),
  response("setProjectConfig", dictionary),
  response("setSystemConfig", dictionary),
  response("setVscodeTheme", z.string().optional()),
  response("setDocBaseUrl", z.string()),
  response("setCodeHar", sdkObject),
  response("proxyFetchResult", fetchResult),
  response("graphQLSchemaFetchResult", fetchResult),
]);
export type RequestPanelResponse = z.infer<typeof requestPanelResponseSchema>;
export type RequestPanelResponseInput = z.input<
  typeof requestPanelResponseSchema
>;
