import {
  status,
  type Client,
  type ClientDuplexStream,
  type ClientReadableStream,
  type ClientUnaryCall,
  type ClientWritableStream,
  type StatusObject,
} from "@grpc/grpc-js";
import type { ProtocolAdapter, ExecutionContext } from "@onapi/core";
import type { GrpcConfig } from "@onapi/domain/requests/grpc";
import {
  createGrpcClient,
  metadataValues,
  requestMetadata,
} from "./connection";
import {
  describeSchema,
  loadDescriptorSchema,
  loadProtoSchema,
  lookupMethod,
  validateMessage,
  type LoadedGrpcSchema,
} from "./schema";
import { reflectDescriptors } from "./reflection";

type Call =
  | ClientUnaryCall
  | ClientReadableStream<object>
  | ClientWritableStream<object>
  | ClientDuplexStream<object, object>;
export interface GrpcExecutionRequest {
  url: string;
  config: GrpcConfig;
}

/** One adapter owns one invocation, including discovery, transport and writable stream. */
export class GrpcAdapter implements ProtocolAdapter<GrpcExecutionRequest> {
  readonly protocol = "grpc" as const;
  private readonly controller = new AbortController();
  private client?: Client;
  private call?: Call;
  private schema?: LoadedGrpcSchema;
  private context?: ExecutionContext;
  private method = "";
  private writable = false;
  constructor(private readonly mode: "discover" | "invoke") {}
  cancel() {
    this.controller.abort();
    this.call?.cancel();
    this.client?.close();
  }
  write(text: string) {
    if (
      !this.writable ||
      !this.call ||
      !("write" in this.call) ||
      !this.schema
    ) {
      throw new Error("This call is not accepting client messages");
    }
    const value = validateMessage(this.schema, this.method, JSON.parse(text));
    this.call.write(value);
    this.context!.publish({
      protocol: this.protocol,
      type: "message.sent",
      value,
    });
  }
  end() {
    if (!this.writable || !this.call || !("end" in this.call)) {
      throw new Error("This call is not accepting client messages");
    }
    this.writable = false;
    this.call.end();
  }
  async execute(request: GrpcExecutionRequest, context: ExecutionContext) {
    this.context = context;
    this.method = request.config.method;
    const started = Date.now();
    try {
      this.controller.signal.throwIfAborted();
      const config = request.config;
      const descriptorSet =
        config.source === "reflection"
          ? this.mode === "discover" || !config.descriptorSet
            ? await reflectDescriptors(
                request.url,
                config,
                this.controller.signal,
              )
            : config.descriptorSet
          : undefined;
      this.controller.signal.throwIfAborted();
      const schema = (this.schema = descriptorSet
        ? loadDescriptorSchema(descriptorSet, config)
        : await loadProtoSchema(config.files, config));
      if (this.mode === "discover") {
        context.publish({
          protocol: this.protocol,
          type: "schema.loaded",
          value: describeSchema(schema, descriptorSet),
        });
        return;
      }
      const method = lookupMethod(schema, config.method);
      const value = validateMessage(
        schema,
        config.method,
        JSON.parse(config.message),
      );
      this.controller.signal.throwIfAborted();
      const client = (this.client = createGrpcClient(request.url, config));
      const metadata = requestMetadata(config);
      const options = {
        deadline: config.deadlineMs ? Date.now() + config.deadlineMs : Infinity,
      };
      await new Promise<void>((resolve, reject) => {
        let response: object | undefined;
        const callback = (_error: Error | null, result?: object) => {
          response = result;
        };
        const call = (this.call = method.requestStream
          ? method.responseStream
            ? client.makeBidiStreamRequest(
                method.path,
                method.requestSerialize,
                method.responseDeserialize,
                metadata,
                options,
              )
            : client.makeClientStreamRequest(
                method.path,
                method.requestSerialize,
                method.responseDeserialize,
                metadata,
                options,
                callback,
              )
          : method.responseStream
            ? client.makeServerStreamRequest(
                method.path,
                method.requestSerialize,
                method.responseDeserialize,
                value,
                metadata,
                options,
              )
            : client.makeUnaryRequest(
                method.path,
                method.requestSerialize,
                method.responseDeserialize,
                value,
                metadata,
                options,
                callback,
              ));
        call.on("metadata", (headers) =>
          context.publish({
            protocol: this.protocol,
            type: "metadata.received",
            metadata: metadataValues(headers),
          }),
        );
        if (method.responseStream) {
          call.on("data", (message) =>
            context.publish({
              protocol: this.protocol,
              type: "message.received",
              value: message,
            }),
          );
        }
        // grpc-js always emits status, including errors; terminate once, after trailers arrive.
        call.on("error", () => {});
        call.on("status", (result: StatusObject) => {
          this.writable = false;
          if (!method.responseStream && response !== undefined) {
            context.publish({
              protocol: this.protocol,
              type: "message.received",
              value: response,
            });
          }
          context.publish({
            protocol: this.protocol,
            type: "status.received",
            status: {
              code: result.code,
              name: status[result.code] ?? "UNKNOWN",
              details: result.details,
              trailers: metadataValues(result.metadata),
              durationMs: Date.now() - started,
            },
          });
          if (result.code !== status.OK && !this.controller.signal.aborted) {
            reject(
              Object.assign(new Error(result.details), {
                code: String(result.code),
              }),
            );
          } else {
            resolve();
          }
        });
        this.writable = method.requestStream;
        context.publish({
          protocol: this.protocol,
          type: "call.started",
          requestStream: method.requestStream,
          responseStream: method.responseStream,
        });
        if (method.requestStream) {
          this.write(config.message);
        } else {
          context.publish({
            protocol: this.protocol,
            type: "message.sent",
            value,
          });
        }
      });
    } catch (error) {
      if (!this.controller.signal.aborted) {
        throw error;
      }
    } finally {
      this.writable = false;
      this.call?.cancel();
      this.client?.close();
      if (this.controller.signal.aborted) {
        context.publish({
          protocol: this.protocol,
          type: "execution.cancelled",
        });
      }
      this.context = undefined;
    }
  }
}
