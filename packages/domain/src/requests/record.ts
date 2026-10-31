import * as z from "zod";
import { extensibleObject } from "../schemas/object";

const id = z
  .string()
  .min(1)
  .refine((value) => value.trim().length > 0);
const description = z.union([
  z.string(),
  extensibleObject({ content: z.string(), type: z.string().optional() }),
]);
const property = {
  id: z.string().optional(),
  name: z.string().optional(),
  disabled: z.boolean().optional(),
  description: description.optional(),
};
export const variableSchema = extensibleObject({
  ...property,
  key: z.string().optional(),
  type: z.string().optional(),
  value: z.unknown().optional(),
});
export const headerSchema = extensibleObject({
  ...property,
  key: z.string().optional(),
  value: z.string().optional(),
  system: z.boolean().optional(),
});
const querySchema = extensibleObject({
  ...property,
  key: z.string().nullable(),
  value: z.string().nullable(),
  system: z.boolean().optional(),
});
const formSchema = extensibleObject({
  ...property,
  key: z.string().optional(),
  value: z.string().optional(),
  type: z.string().optional(),
  src: z.union([z.string(), z.array(z.string())]).optional(),
  contentType: z.string().optional(),
});
const authTypes = [
  "noauth",
  "basic",
  "bearer",
  "apikey",
  "digest",
  "oauth1",
  "oauth2",
  "hawk",
  "awsv4",
  "edgegrid",
  "ntlm",
  "jwt",
  "asap",
] as const;
const authSchema = extensibleObject({
  ...property,
  type: z.enum(authTypes).optional(),
  basic: z.array(variableSchema).optional(),
  bearer: z.array(variableSchema).optional(),
  apikey: z.array(variableSchema).optional(),
  digest: z.array(variableSchema).optional(),
  oauth1: z.array(variableSchema).optional(),
  oauth2: z.array(variableSchema).optional(),
  hawk: z.array(variableSchema).optional(),
  awsv4: z.array(variableSchema).optional(),
  edgegrid: z.array(variableSchema).optional(),
  ntlm: z.array(variableSchema).optional(),
  jwt: z.array(variableSchema).optional(),
  asap: z.array(variableSchema).optional(),
});
export const requestUrlSchema = extensibleObject({
  ...property,
  raw: z.string().optional(),
  protocol: z.string().optional(),
  hash: z.string().optional(),
  host: z.union([z.string(), z.array(z.string())]).optional(),
  path: z.union([z.string(), z.array(z.string())]).optional(),
  port: z.string().optional(),
  auth: extensibleObject({ user: z.string(), password: z.string() }).optional(),
  query: z.union([z.string(), z.array(querySchema)]).optional(),
  variable: z.array(variableSchema).optional(),
});
export const httpBodySchema = extensibleObject({
  mode: z.string(),
  raw: z.string().optional(),
  urlencoded: z.array(querySchema).optional(),
  formdata: z.array(formSchema).optional(),
  file: extensibleObject({ src: z.string() }).optional(),
  graphql: extensibleObject({
    query: z.string().optional(),
    variables: z.string().optional(),
  }).optional(),
  options: extensibleObject({
    raw: extensibleObject({ language: z.string().optional() }).optional(),
  }).optional(),
});
export const httpRequestSchema = extensibleObject({
  ...property,
  url: z.union([z.string(), requestUrlSchema]),
  method: z.string().min(1).optional(),
  header: z.array(headerSchema).optional(),
  body: httpBodySchema.optional(),
  auth: authSchema.optional(),
});
export const httpScriptSchema = extensibleObject({
  ...property,
  type: z.string().optional(),
  src: z.string().optional(),
  exec: z.union([z.string(), z.array(z.string())]).optional(),
});
export const httpEventSchema = extensibleObject({
  ...property,
  listen: z.string().optional(),
  script: z.union([z.string(), z.array(z.string()), httpScriptSchema]),
});
export const httpResponseSchema = extensibleObject({
  ...property,
  code: z.number(),
  responseTime: z.number().optional(),
  status: z.string().optional(),
  header: z.array(headerSchema).optional(),
  body: z.string().optional(),
  originalRequest: httpRequestSchema.optional(),
});
export const recordIdentityFields = {
  id,
  parentId: z.string(),
  name: z.string(),
};
const metadata = {
  url: z.string().optional(),
  project_id: z.string().optional(),
  sort: z.number().optional(),
  status: z.number().optional(),
  version: z.number().optional(),
  tags: z.array(z.string()).optional(),
  description: description.optional(),
  server_id: z.string().optional(),
  attribute_info: z.record(z.string(), z.unknown()).optional(),
  protocol: z.string().optional(),
};
export const httpEditorRecordSchema = extensibleObject({
  ...recordIdentityFields,
  ...metadata,
  kind: z.enum(["api", "graphql"]),
  request: httpRequestSchema,
  event: z.array(httpEventSchema).optional(),
  variable: z.array(variableSchema).optional(),
  response: z.array(httpResponseSchema).optional(),
  graphqlSchema: z.unknown().optional(),
  search_id: z.string().optional(),
});
export const nonHttpEditorRecordSchema = extensibleObject({
  ...recordIdentityFields,
  ...metadata,
  kind: z.enum([
    "folder",
    "websocket",
    "socketio",
    "doc",
    "grpc",
    "sample",
    "sample_group",
    "socket",
    "socket_method",
    "socket_service",
  ]),
});
export const editorRecordSchema = extensibleObject({
  ...recordIdentityFields,
  ...metadata,
  // Incoming mixed records carry protocol payloads; the next stage narrows
  // HTTP payloads to their fully validated native fields.
  request: z.unknown().optional(),
  event: z.unknown().optional(),
  response: z.unknown().optional(),
  variable: z.unknown().optional(),
  graphqlSchema: z.unknown().optional(),
  search_id: z.string().optional(),
  kind: z.enum([
    "api",
    "graphql",
    "folder",
    "websocket",
    "socketio",
    "doc",
    "grpc",
    "sample",
    "sample_group",
    "socket",
    "socket_method",
    "socket_service",
  ]),
}).pipe(z.union([httpEditorRecordSchema, nonHttpEditorRecordSchema]));
export type HttpEditorRecord = z.infer<typeof httpEditorRecordSchema>;
// Other protocols still use their existing feature-specific data models. This
// type promises only validated identity/metadata, with opaque extension fields.
export type NonHttpEditorRecord = z.infer<typeof nonHttpEditorRecordSchema> &
  Record<string, any>;
export type EditorRecord = HttpEditorRecord | NonHttpEditorRecord;
export type HttpEditorProps = {
  apisData: HttpEditorRecord;
  onApisDataChange: (data: HttpEditorRecord) => void;
  type?: string;
};

export type HttpEditorScript = z.output<typeof httpScriptSchema>;
export type HttpEditorEvent = z.output<typeof httpEventSchema>;
