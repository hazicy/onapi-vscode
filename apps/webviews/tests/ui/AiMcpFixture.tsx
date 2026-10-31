import { useState } from "react";
import AiDebug from "@/features/requests/protocols/ai/AiDebug";
import McpDebug from "@/features/requests/protocols/mcp/McpDebug";
import {
  aiEditorRecordSchema,
  mcpEditorRecordSchema,
  type AiEditorRecord,
  type McpEditorRecord,
} from "@onapi/domain/requests/record";
import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";

export default function AiMcpFixture() {
  const kind =
    new URLSearchParams(location.search).get("aiMcp") === "mcp" ? "mcp" : "ai";
  const initial = {
    id: "ai-mcp-fixture",
    parentId: "0",
    name: "Test",
    kind,
    url: "http://localhost/v1",
    ai: { model: "test-model" },
  };
  const [data, setData] = useState<AiEditorRecord | McpEditorRecord>(() =>
    kind === "ai"
      ? aiEditorRecordSchema.parse(initial)
      : mcpEditorRecordSchema.parse(initial),
  );
  const [snapshot, setSnapshot] = useState(data);
  window.vscode = {
    postMessage: (message: unknown) => {
      (window as any).aiMcpMessages ??= [];
      (window as any).aiMcpMessages.push(message);
    },
  } as typeof window.vscode;
  return (
    <div style={{ height: "100vh" }}>
      <button onClick={() => setSnapshot(data)}>Checkpoint</button>
      <button onClick={() => setData(snapshot)}>Revert document</button>
      <button
        onClick={() => sendRequestPanelMessage({ action: "saveApiData", data })}
      >
        Native save
      </button>
      {data.kind === "ai" ? (
        <AiDebug apisData={data} onApisDataChange={setData} />
      ) : (
        <McpDebug apisData={data} onApisDataChange={setData} />
      )}
    </div>
  );
}
