import { useState } from "react";
import GrpcDebug from "@/features/requests/protocols/grpc/GrpcDebug";
import { grpcEditorRecordSchema } from "@onapi/domain/requests/record";
import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
export default function GrpcFixture() {
  const initial = grpcEditorRecordSchema.parse({
    id: "grpc-fixture",
    parentId: "0",
    name: "gRPC request",
    kind: "grpc",
    url: "localhost:50051",
    grpc: new URLSearchParams(location.search).has("saved")
      ? {
          definition: {
            source: "proto",
            files: [
              {
                name: "hello.proto",
                content:
                  'syntax = "proto3"; package example; message Request { string name = 1; } message Reply { string message = 1; } service Greeter { rpc SayHello(Request) returns(Reply); }',
              },
            ],
          },
          method: "/example.Greeter/SayHello",
        }
      : {},
  });
  const [record, setRecord] = useState(initial);
  const [saved, setSaved] = useState(initial);
  window.vscode = {
    postMessage: (message: unknown) => {
      (window as any).grpcMessages ??= [];
      (window as any).grpcMessages.push(message);
    },
  } as typeof window.vscode;
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div>
        <button onClick={() => setSaved(record)}>Checkpoint</button>
        <button onClick={() => setRecord(saved)}>Revert document</button>
        <button
          onClick={() =>
            sendRequestPanelMessage({ action: "saveApiData", data: record })
          }
        >
          Native save
        </button>
      </div>
      <GrpcDebug apisData={record} onApisDataChange={setRecord} />
    </div>
  );
}
