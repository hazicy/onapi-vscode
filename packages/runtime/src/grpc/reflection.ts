import protobuf from "protobufjs";
import descriptor from "protobufjs/ext/descriptor/index.js";
import { status, type ServiceError } from "@grpc/grpc-js";
import type { GrpcCallConfig } from "@onapi/domain/requests/grpc";
import { createGrpcClient, requestMetadata } from "./connection";

// Standard reflection wire messages; both v1 and v1alpha share this encoding.
const reflection = protobuf.parse(`syntax = "proto3";
message Request { string host = 1; oneof message_request { string file_by_filename = 3; string file_containing_symbol = 4; string list_services = 7; } }
message Response { string valid_host = 1; Request original_request = 2; oneof message_response { FileResponse file_descriptor_response = 4; ListResponse list_services_response = 6; ErrorResponse error_response = 7; } }
message FileResponse { repeated bytes file_descriptor_proto = 1; }
message ListResponse { repeated ServiceResponse service = 1; }
message ServiceResponse { string name = 1; }
message ErrorResponse { int32 error_code = 1; string error_message = 2; }`).root;
const requestType = reflection.lookupType("Request");
const responseType = reflection.lookupType("Response");
interface ReflectionResponse {
  fileDescriptorResponse?: { fileDescriptorProto: Buffer[] };
  listServicesResponse?: { service: { name: string }[] };
  errorResponse?: { errorCode: number; errorMessage: string };
}
export async function reflectDescriptors(
  address: string,
  config: GrpcCallConfig,
  signal: AbortSignal,
): Promise<string> {
  const client = createGrpcClient(address, config);
  const abort = () => client.close();
  signal.addEventListener("abort", abort, { once: true });
  const query = (version: string, message: Record<string, string>) =>
    new Promise<ReflectionResponse>((resolve, reject) => {
      signal.throwIfAborted();
      const stream = client.makeBidiStreamRequest(
        `/${version}.ServerReflection/ServerReflectionInfo`,
        (value) =>
          Buffer.from(
            requestType
              .encode(requestType.fromObject(value as Record<string, string>))
              .finish(),
          ),
        (value) =>
          responseType.toObject(responseType.decode(value), {
            bytes: Buffer,
          }) as ReflectionResponse,
        requestMetadata(config),
        {
          deadline: Date.now() + Math.min(config.deadlineMs || 10_000, 10_000),
        },
      );
      const cancel = () => {
        stream.cancel();
        reject(signal.reason);
      };
      signal.addEventListener("abort", cancel, { once: true });
      let settled = false;
      const finish = () => signal.removeEventListener("abort", cancel);
      stream.on("error", (error) => {
        if (!settled) {
          settled = true;
          finish();
          reject(error);
        }
      });
      stream.on("data", (response: ReflectionResponse) => {
        if (settled) {
          return;
        }
        settled = true;
        finish();
        if (response.errorResponse) {
          reject(
            Object.assign(new Error(response.errorResponse.errorMessage), {
              code: response.errorResponse.errorCode,
            }),
          );
        } else {
          resolve(response);
        }
        stream.cancel();
      });
      stream.on("end", () => {
        if (!settled) {
          settled = true;
          finish();
          reject(new Error("Reflection returned no service definition"));
        }
      });
      stream.write(message);
      stream.end();
    });
  try {
    signal.throwIfAborted();
    let version = "grpc.reflection.v1";
    let services: ReflectionResponse;
    try {
      services = await query(version, { listServices: "" });
    } catch (error) {
      if ((error as ServiceError).code !== status.UNIMPLEMENTED) {
        throw error;
      }
      version = "grpc.reflection.v1alpha";
      services = await query(version, { listServices: "" });
    }
    const files = new Map<string, descriptor.IFileDescriptorProto>();
    const collect = (response: ReflectionResponse) => {
      for (const bytes of response.fileDescriptorResponse
        ?.fileDescriptorProto ?? []) {
        const file = descriptor.FileDescriptorProto.toObject(
          descriptor.FileDescriptorProto.decode(bytes),
        ) as descriptor.IFileDescriptorProto;
        if (files.size >= 500) {
          throw new Error("Reflection returned too many proto files");
        }
        files.set(file.name!, file);
      }
    };
    const list = services.listServicesResponse?.service ?? [];
    if (list.length > 500) {
      throw new Error("Reflection returned too many services");
    }
    for (const service of list) {
      if (service.name.startsWith("grpc.reflection.")) {
        continue;
      }
      collect(await query(version, { fileContainingSymbol: service.name }));
    }
    for (const file of files.values()) {
      for (const dependency of file.dependency ?? []) {
        if (!files.has(dependency)) {
          collect(await query(version, { fileByFilename: dependency }));
        }
      }
    }
    if (!files.size) {
      throw new Error("No services were returned by server reflection");
    }
    return Buffer.from(
      descriptor.FileDescriptorSet.encode(
        descriptor.FileDescriptorSet.fromObject({ file: [...files.values()] }),
      ).finish(),
    ).toString("base64");
  } finally {
    signal.removeEventListener("abort", abort);
    client.close();
  }
}
