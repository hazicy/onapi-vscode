import { useEffect, useRef, useState } from "react";
import type { GrpcEditorRecord } from "@onapi/domain/requests/record";
import type { GrpcStatus, GrpcConfig } from "@onapi/domain/requests/grpc";
import {
  readRequestPanelResponse,
  sendRequestPanelMessage,
} from "@/shared/bridge/request-panel";
import { useProtocolExecution } from "../shared/useProtocolExecution";

export type GrpcMessage = {
  direction: "sent" | "received";
  value: unknown;
  timestamp: number;
  sequence: number;
};
export function useGrpc(
  record: GrpcEditorRecord,
  change: (record: GrpcEditorRecord) => void,
) {
  const [messages, setMessages] = useState<GrpcMessage[]>([]);
  const [receivedCount, setReceivedCount] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [status, setStatus] = useState<GrpcStatus>();
  const [metadata, setMetadata] = useState<Record<string, string[]>>({});
  const [writable, setWritable] = useState(false);
  const [importing, setImporting] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [phase, setPhase] = useState<"discover" | "invoke">("discover");
  const latest = useRef({ record, change });
  latest.current = { record, change };
  const importId = useRef("");
  const execution = useProtocolExecution(record.id, (envelope) => {
    const event = envelope.event;
    if (event.protocol !== "grpc") {
      return;
    }
    switch (event.type) {
      case "schema.loaded": {
        const current = latest.current;
        const methods = event.value.methods;
        current.change({
          ...current.record,
          grpc: {
            ...current.record.grpc,
            methods,
            descriptorSet: event.value.descriptorSet,
            method: methods.some(
              (method) => method.path === current.record.grpc.method,
            )
              ? current.record.grpc.method
              : (methods[0]?.path ?? ""),
          },
        });
        break;
      }
      case "call.started":
        setWritable(event.requestStream);
        break;
      case "message.sent":
      case "message.received":
        setTotalMessages((count) => count + 1);
        if (event.type === "message.received") {
          setReceivedCount((count) => count + 1);
        }
        setMessages((current) => [
          ...current.slice(-199),
          {
            direction: event.type === "message.sent" ? "sent" : "received",
            value: event.value,
            timestamp: envelope.timestamp,
            sequence: envelope.sequence,
          },
        ]);
        break;
      case "metadata.received":
        setMetadata(event.metadata);
        break;
      case "status.received":
        setStatus(event.status);
        setWritable(false);
        break;
      case "execution.cancelled":
        setCancelled(true);
        setWritable(false);
        break;
      case "execution.completed":
        setWritable(false);
        break;
    }
  });
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const response = readRequestPanelResponse(event.data);
      if (
        response?.action === "grpcImported" &&
        response.requestId === importId.current &&
        response.data.id === record.id
      ) {
        setImporting(false);
        if (!response.data.files.length) {
          return;
        }
        const current = latest.current;
        current.change({
          ...current.record,
          grpc: {
            ...current.record.grpc,
            source: "proto",
            files: response.data.files,
            methods: [],
            descriptorSet: undefined,
            method: "",
          },
        });
      }
      if (
        response?.action === "requestPanelError" &&
        response.data.targetId === record.id &&
        ["grpc_write", "grpc_end", "grpc_import"].includes(
          response.data.action ?? "",
        )
      ) {
        execution.setError(response.data.error.message);
        setImporting(false);
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [record.id, execution.setError]);
  const start = (action: "grpc_discover" | "grpc_invoke") =>
    execution.start((requestId) => {
      if (record.grpc.source === "reflection" && !record.url?.trim()) {
        throw new Error("Enter a server address to use reflection");
      }
      if (record.grpc.source === "proto" && !record.grpc.files.length) {
        throw new Error("Import a .proto file in Service definition first");
      }
      if (action === "grpc_invoke") {
        if (!record.url?.trim()) {
          throw new Error("Server address is required");
        }
        if (!record.grpc.method) {
          throw new Error("Load a service definition and select a method");
        }
        if (!/{{[^{}]+}}/.test(record.grpc.message)) {
          const value = JSON.parse(record.grpc.message);
          if (!value || typeof value !== "object" || Array.isArray(value)) {
            throw new Error("Message must be a JSON object");
          }
        }
        setMessages([]);
        setReceivedCount(0);
        setTotalMessages(0);
        setStatus(undefined);
        setMetadata({});
        setCancelled(false);
      }
      setPhase(action === "grpc_discover" ? "discover" : "invoke");
      return {
        action,
        requestId,
        data: { id: record.id, url: record.url ?? "", config: record.grpc },
      };
    });
  return {
    ...execution,
    messages,
    receivedCount,
    totalMessages,
    status,
    metadata,
    writable,
    importing,
    cancelled,
    phase,
    discover: () => start("grpc_discover"),
    invoke: () => start("grpc_invoke"),
    cancel: () =>
      sendRequestPanelMessage({
        action: "grpc_cancel",
        data: { executionId: execution.activeId()! },
      }),
    write: () => {
      try {
        if (!/{{[^{}]+}}/.test(record.grpc.message)) {
          JSON.parse(record.grpc.message);
        }
        execution.setError("");
        sendRequestPanelMessage({
          action: "grpc_write",
          data: {
            id: record.id,
            executionId: execution.activeId()!,
            message: record.grpc.message,
          },
        });
      } catch (error) {
        execution.setError(String(error));
      }
    },
    end: () => {
      sendRequestPanelMessage({
        action: "grpc_end",
        data: { executionId: execution.activeId()! },
      });
      setWritable(false);
    },
    importFiles: (directory = false) => {
      importId.current = sendRequestPanelMessage({
        action: "grpc_import",
        data: { id: record.id, directory },
      });
      setImporting(true);
      execution.setError("");
    },
    clearMessages: () => setMessages([]),
  };
}
export type GrpcController = ReturnType<typeof useGrpc>;
export type GrpcConfigChange = (patch: Partial<GrpcConfig>) => void;
