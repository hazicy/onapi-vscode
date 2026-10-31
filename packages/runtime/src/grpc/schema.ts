import path from "node:path";
import protobuf from "protobufjs";
import "protobufjs/ext/descriptor/index.js";
import {
  fromJSON,
  loadFileDescriptorSetFromBuffer,
  type PackageDefinition,
  type MethodDefinition,
} from "@grpc/proto-loader";
import type {
  GrpcConfig,
  GrpcMethod,
  GrpcProtoFile,
  GrpcServiceDefinition,
} from "@onapi/domain/requests/grpc";

const options = (config: GrpcConfig) => ({
  keepCase: true,
  longs: String,
  enums: String,
  bytes: String,
  defaults: config.includeDefaults,
  oneofs: true,
});
export interface LoadedGrpcSchema {
  definition: PackageDefinition;
  root: protobuf.Root;
}
export async function loadProtoSchema(
  files: GrpcProtoFile[],
  config: GrpcConfig,
): Promise<LoadedGrpcSchema> {
  if (!files.length) {
    throw new Error("Import a .proto file or use server reflection first");
  }
  const sources = new Map(
    files.map((file) => [file.name.replaceAll("\\", "/"), file.content]),
  );
  if (sources.size !== files.length) {
    throw new Error("Proto filenames must be unique");
  }
  const root = new protobuf.Root();
  root.resolvePath = (origin, target) => {
    if (sources.has(target) || target.startsWith("google/protobuf/")) {
      return target;
    }
    const relative = path.posix.normalize(
      path.posix.join(path.posix.dirname(origin), target),
    );
    return sources.has(relative) ? relative : target;
  };
  root.fetch = (name, callback) => {
    const content = sources.get(name);
    if (content === undefined) {
      callback(
        new Error(
          `Missing imported proto: ${name}. Import it with the service definition.`,
        ),
      );
    } else {
      (callback as (error: Error | null, content: string) => void)(
        null,
        content,
      );
    }
  };
  await root.load(
    files.map((file) => file.name),
    { keepCase: true, alternateCommentMode: true },
  );
  root.resolveAll();
  return { root, definition: fromJSON(root.toJSON(), options(config)) };
}
export function loadDescriptorSchema(
  base64: string,
  config: GrpcConfig,
): LoadedGrpcSchema {
  const buffer = Buffer.from(base64, "base64");
  const Root = protobuf.Root as typeof protobuf.Root & {
    fromDescriptor(value: Uint8Array): protobuf.Root;
  };
  const root = Root.fromDescriptor(buffer);
  root.resolveAll();
  return {
    root,
    definition: loadFileDescriptorSetFromBuffer(buffer, options(config)),
  };
}
function example(
  type: protobuf.Type,
  seen = new Set<string>(),
): Record<string, unknown> {
  if (seen.has(type.fullName) || seen.size >= 3) {
    return {};
  }
  const next = new Set([...seen, type.fullName]);
  return Object.fromEntries(
    type.fieldsArray
      .filter((field) => !field.partOf || field.partOf.oneof[0] === field.name)
      .map((field) => {
        field.resolve();
        let value: unknown = "";
        if (field.map) {
          value = {};
        } else if (field.repeated) {
          value = [];
        } else if (field.resolvedType instanceof protobuf.Type) {
          value = example(field.resolvedType, next);
        } else if (field.resolvedType instanceof protobuf.Enum) {
          value = Object.keys(field.resolvedType.values)[0] ?? 0;
        } else if (field.type === "bool") {
          value = false;
        } else if (/64$/.test(field.type)) {
          value = "0";
        } else if (field.type !== "string" && field.type !== "bytes") {
          value = 0;
        }
        return [field.name, value];
      }),
  );
}
export function describeSchema(
  schema: LoadedGrpcSchema,
  descriptorSet?: string,
): GrpcServiceDefinition {
  const methods: GrpcMethod[] = [];
  for (const [service, entry] of Object.entries(schema.definition)) {
    if ("format" in entry) {
      continue;
    }
    for (const [name, method] of Object.entries(entry)) {
      const reflected = schema.root.lookupService(service).methods[name];
      if (!reflected) {
        continue;
      }
      reflected.resolve();
      const request = reflected.resolvedRequestType!;
      methods.push({
        path: method.path,
        service,
        name,
        requestStream: method.requestStream,
        responseStream: method.responseStream,
        requestType: request.fullName.replace(/^\./, ""),
        responseType: reflected.resolvedResponseType!.fullName.replace(
          /^\./,
          "",
        ),
        example: example(request),
        fields: request.fieldsArray.map((field) => ({
          name: field.name,
          type: field.map
            ? `map<${"keyType" in field ? String(field.keyType) : "string"}, ${field.type}>`
            : field.type,
          repeated: field.repeated,
          description: field.comment ?? "",
        })),
      });
    }
  }
  return { methods, descriptorSet };
}
export function lookupMethod(
  schema: LoadedGrpcSchema,
  methodPath: string,
): MethodDefinition<object, object> {
  const [, service, name] = methodPath.split("/");
  const definition = schema.definition[service];
  if (!definition || "format" in definition || !definition[name]) {
    throw new Error("Select a method from the loaded service definition");
  }
  return definition[name];
}
function checkFields(
  type: protobuf.Type,
  value: Record<string, unknown>,
  prefix = "",
  depth = 0,
) {
  if (depth > 64) {
    throw new Error("Message nesting exceeds the supported depth");
  }
  for (const [key, item] of Object.entries(value)) {
    const field = type.fields[key];
    if (!field) {
      throw new Error(`Unknown message field: ${prefix}${key}`);
    }
    if (item === null) {
      continue;
    }
    field.resolve();
    const check = (input: unknown) => {
      const name = `${prefix}${key}`;
      if (field.resolvedType instanceof protobuf.Type) {
        if (!input || typeof input !== "object" || Array.isArray(input)) {
          throw new Error(`${name} must be an object`);
        }
        checkFields(
          field.resolvedType,
          input as Record<string, unknown>,
          `${name}.`,
          depth + 1,
        );
      } else if (field.resolvedType instanceof protobuf.Enum) {
        if (
          typeof input === "string" &&
          !Object.hasOwn(field.resolvedType.values, input)
        ) {
          throw new Error(`${name} has an unknown enum value`);
        }
        if (typeof input !== "string" && !Number.isInteger(input)) {
          throw new Error(`${name} must be an enum name or integer`);
        }
      } else if (field.type === "string" && typeof input !== "string") {
        throw new Error(`${name} must be a string`);
      } else if (field.type === "bool" && typeof input !== "boolean") {
        throw new Error(`${name} must be a boolean`);
      } else if (/^(?:u?int|sint|fixed|sfixed)(32|64)$/.test(field.type)) {
        if (
          (typeof input !== "number" && typeof input !== "string") ||
          !/^-?\d+$/.test(String(input))
        ) {
          throw new Error(`${name} must be an integer`);
        }
        if (typeof input === "number" && !Number.isSafeInteger(input)) {
          throw new Error(`${name} must use a string for large integers`);
        }
        const bits = field.type.endsWith("64") ? 64n : 32n;
        const unsigned =
          field.type.startsWith("u") || field.type.startsWith("fixed");
        const integer = BigInt(String(input));
        const min = unsigned ? 0n : -(1n << (bits - 1n));
        const max = unsigned ? (1n << bits) - 1n : (1n << (bits - 1n)) - 1n;
        if (integer < min || integer > max) {
          throw new Error(`${name} is outside its protobuf integer range`);
        }
      } else if (
        (field.type === "float" || field.type === "double") &&
        (typeof input !== "number" || !Number.isFinite(input))
      ) {
        throw new Error(`${name} must be a finite number`);
      } else if (
        field.type === "bytes" &&
        (typeof input !== "string" ||
          !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
            input,
          ))
      ) {
        throw new Error(`${name} must be base64 encoded`);
      }
    };
    if (field.map) {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new Error(`${prefix}${key} must be a map object`);
      }
      for (const entry of Object.values(item)) {
        check(entry);
      }
    } else if (field.repeated) {
      if (!Array.isArray(item)) {
        throw new Error(`${prefix}${key} must be an array`);
      }
      for (const entry of item) {
        check(entry);
      }
    } else {
      check(item);
    }
  }
}
export function validateMessage(
  schema: LoadedGrpcSchema,
  path: string,
  value: unknown,
): object {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Message must be a JSON object");
  }
  const [, service, methodName] = path.split("/");
  const method = schema.root.lookupService(service).methods[methodName];
  method.resolve();
  const type = method.resolvedRequestType!;
  checkFields(type, value as Record<string, unknown>);
  const message = type.fromObject(value as Record<string, unknown>);
  const error = type.verify(message);
  if (error) {
    throw new Error(error);
  }
  return value;
}
