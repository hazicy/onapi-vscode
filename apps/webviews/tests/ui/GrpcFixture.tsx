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
