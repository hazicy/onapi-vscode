import {
  Client,
  Metadata,
  credentials,
  type ClientOptions,
} from "@grpc/grpc-js";
import type { GrpcCallConfig } from "@onapi/domain/requests/grpc";

export function grpcTarget(address: string, config: GrpcCallConfig) {
  const value = address.trim();
  if (!value) {
    throw new Error("Server address is required");
  }
  const scheme = /^(grpc|grpcs|http|https):\/\//i
    .exec(value)?.[1]
    ?.toLowerCase();
  const parsed = new URL(
    `http://${value.replace(/^(?:grpcs?|https?):\/\//i, "")}`,
  );
  if (
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("Use a gRPC host and port, for example localhost:50051");
  }
  return {
    target: parsed.host,
    secure: config.tls.enabled || scheme === "grpcs" || scheme === "https",
  };
}
export function createGrpcClient(address: string, config: GrpcCallConfig) {
  const { target, secure } = grpcTarget(address, config);
  const pem = (value: string) => (value ? Buffer.from(value) : undefined);
  if (!!config.tls.privateKey !== !!config.tls.clientCertificate) {
    throw new Error(
      "Client certificate and private key must be configured together",
    );
  }
  const channelCredentials = secure
    ? credentials.createSsl(
        pem(config.tls.rootCertificates),
        pem(config.tls.privateKey),
        pem(config.tls.clientCertificate),
      )
    : credentials.createInsecure();
  const options: ClientOptions = {
    "grpc.max_receive_message_length": config.maxReceiveMessageBytes || -1,
  };
  if (config.tls.serverName) {
    options["grpc.ssl_target_name_override"] = config.tls.serverName;
    options["grpc.default_authority"] = config.tls.serverName;
  }
  return new Client(target, channelCredentials, options);
}
export function requestMetadata(config: GrpcCallConfig) {
  const metadata = new Metadata();
  for (const row of config.metadata) {
    if (!row.enabled || !row.key.trim()) {
      continue;
    }
    const key = row.key.trim().toLowerCase();
    if (
      key.endsWith("-bin") &&
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
        row.value,
      )
    ) {
      throw new Error(`${key} must contain valid base64`);
    }
    metadata.add(
      key,
      key.endsWith("-bin") ? Buffer.from(row.value, "base64") : row.value,
    );
  }
  const auth = config.auth;
  if (auth.type === "bearer") {
    metadata.set("authorization", `Bearer ${auth.token}`);
  }
  if (auth.type === "basic") {
    metadata.set(
      "authorization",
      `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString("base64")}`,
    );
  }
  if (auth.type === "apikey") {
    metadata.set(auth.key.toLowerCase(), auth.value);
  }
  return metadata;
}
export function metadataValues(metadata: Metadata): Record<string, string[]> {
  return Object.fromEntries(
    Object.keys(metadata.getMap()).map((key) => [
      key,
      metadata
        .get(key)
        .map((value) =>
          Buffer.isBuffer(value) ? value.toString("base64") : value,
        ),
    ]),
  );
}
