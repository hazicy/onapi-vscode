import * as z from "zod";

export const grpcProtoFileSchema = z.object({
  name: z.string().min(1),
  content: z.string().max(2 * 1024 * 1024),
});
export const grpcMetadataSchema = z
  .array(
    z.object({
      key: z.string(),
      value: z.string(),
      enabled: z.boolean().default(true),
    }),
  )
  .max(200);
export const grpcMethodSchema = z.object({
  path: z.string(),
  service: z.string(),
  name: z.string(),
  requestStream: z.boolean(),
  responseStream: z.boolean(),
  requestType: z.string(),
  responseType: z.string(),
  example: z.record(z.string(), z.unknown()),
  fields: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      repeated: z.boolean(),
      description: z.string(),
    }),
  ),
});
export const grpcSchemaDescriptionSchema = z.object({
  methods: z.array(grpcMethodSchema),
  descriptorSet: z.string().optional(),
});
export const grpcDefinitionSchema = z.discriminatedUnion("source", [
  z.strictObject({
    source: z.literal("proto"),
    files: z.array(grpcProtoFileSchema).max(100),
  }),
  z.strictObject({
    source: z.literal("reflection"),
    descriptorSet: z
      .string()
      .max(16 * 1024 * 1024)
      .optional(),
  }),
]);
export const grpcCallConfigSchema = z.strictObject({
  method: z.string().default(""),
  message: z
    .string()
    .max(2 * 1024 * 1024)
    .default("{}"),
  metadata: grpcMetadataSchema.default([]),
  auth: z
    .object({
      type: z.enum(["none", "bearer", "basic", "apikey"]).default("none"),
      token: z.string().default(""),
      username: z.string().default(""),
      password: z.string().default(""),
      key: z.string().default("x-api-key"),
      value: z.string().default(""),
    })
    .prefault({}),
  tls: z
    .object({
      enabled: z.boolean().default(false),
      rootCertificates: z.string().default(""),
      clientCertificate: z.string().default(""),
      privateKey: z.string().default(""),
      serverName: z.string().default(""),
    })
    .prefault({}),
  deadlineMs: z.number().int().min(0).max(2147483647).default(30_000),
  maxReceiveMessageBytes: z
    .number()
    .int()
    .min(0)
    .max(2147483647)
    .default(4 * 1024 * 1024),
  includeDefaults: z.boolean().default(true),
});
export const grpcConfigSchema = grpcCallConfigSchema
  .extend({
    definition: grpcDefinitionSchema.prefault({ source: "reflection" }),
  })
  .prefault({});
export type GrpcCallConfig = z.infer<typeof grpcCallConfigSchema>;
export type GrpcDefinition = z.infer<typeof grpcDefinitionSchema>;
export const grpcStatusSchema = z.object({
  code: z.number().int(),
  name: z.string(),
  details: z.string(),
  trailers: z.record(z.string(), z.array(z.string())),
  durationMs: z.number(),
});
export type GrpcConfig = z.infer<typeof grpcConfigSchema>;
export type GrpcProtoFile = z.infer<typeof grpcProtoFileSchema>;
export type GrpcMethod = z.infer<typeof grpcMethodSchema>;
export type GrpcSchemaDescription = z.infer<typeof grpcSchemaDescriptionSchema>;
export type GrpcStatus = z.infer<typeof grpcStatusSchema>;
