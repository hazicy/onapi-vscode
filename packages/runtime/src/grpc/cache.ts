import { createHash } from "node:crypto";
import type {
  GrpcDefinition,
  GrpcCallConfig,
} from "@onapi/domain/requests/grpc";
import {
  loadDescriptorSchema,
  loadProtoSchema,
  type LoadedGrpcSchema,
} from "./schema";

type Entry = { bytes: number; schema: Promise<LoadedGrpcSchema> };
/** Content-addressed LRU: only reusable type/codec data is cached, never credentials or call state. */
export class GrpcSchemaCache {
  private readonly entries = new Map<string, Entry>();
  private bytes = 0;
  constructor(
    private readonly maxEntries = 16,
    private readonly maxBytes = 32 * 1024 * 1024,
  ) {}
  get size() {
    return this.entries.size;
  }
  clear() {
    this.entries.clear();
    this.bytes = 0;
  }
  load(
    definition: GrpcDefinition,
    options: Pick<GrpcCallConfig, "includeDefaults">,
  ): Promise<LoadedGrpcSchema> {
    const normalized =
      definition.source === "proto"
        ? {
            ...definition,
            files: [...definition.files].sort((a, b) =>
              a.name.localeCompare(b.name),
            ),
          }
        : definition;
    const source = JSON.stringify([normalized, options.includeDefaults]);
    const key = createHash("sha256").update(source).digest("hex");
    const cached = this.entries.get(key);
    if (cached) {
      this.entries.delete(key);
      this.entries.set(key, cached);
      return cached.schema;
    }
    const schema = Promise.resolve().then(() =>
      definition.source === "proto"
        ? loadProtoSchema(definition.files, options)
        : definition.descriptorSet
          ? loadDescriptorSchema(definition.descriptorSet, options)
          : Promise.reject(
              new Error("Load a reflection service definition first"),
            ),
    );
    const bytes = Buffer.byteLength(source);
    if (bytes <= this.maxBytes && this.maxEntries > 0) {
      const entry = { bytes, schema };
      this.entries.set(key, entry);
      this.bytes += bytes;
      while (
        this.entries.size > this.maxEntries ||
        this.bytes > this.maxBytes
      ) {
        const oldest = this.entries.keys().next().value!;
        this.bytes -= this.entries.get(oldest)!.bytes;
        this.entries.delete(oldest);
      }
      void schema.catch(() => {
        if (this.entries.get(key) === entry) {
          this.entries.delete(key);
          this.bytes -= bytes;
        }
      });
    }
    return schema;
  }
}
export const grpcSchemaCache = new GrpcSchemaCache();
