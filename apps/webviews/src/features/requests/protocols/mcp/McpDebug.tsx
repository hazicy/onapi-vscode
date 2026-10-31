import { useState } from "react";
import type { McpEditorRecord } from "@onapi/domain/requests/record";
import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import { useProtocolExecution } from "../shared/useProtocolExecution";
import {
  ProtocolEditor,
  ProtocolTabs,
  HeadersEditor,
  ProtocolError,
  ProtocolResponse,
} from "../shared/ProtocolEditor";
import {
  mcpInput,
  parseMcpConfig,
  parseMcpOperation,
} from "../shared/request-input";
import styles from "../shared/ProtocolEditor.module.css";

type Props = {
  apisData: McpEditorRecord;
  onApisDataChange: (record: McpEditorRecord) => void;
};
export default function McpDebug({
  apisData: record,
  onApisDataChange: change,
}: Props) {
  const [tab, setTab] = useState("request");
  const [connected, setConnected] = useState(false);
  const [response, setResponse] = useState<unknown>(undefined);
  const [entries, setEntries] = useState<Record<string, unknown>[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [listMethod, setListMethod] = useState("");
  const [disconnecting, setDisconnecting] = useState(false);
  const input = mcpInput(record);
  const execution = useProtocolExecution(record.id, ({ event }) => {
    if (event.protocol !== "mcp") {
      return;
    }
    if (event.type === "connection.opened") {
      setConnected(true);
      setResponse(event.value);
    }
    if (event.type === "connection.closed") {
      setConnected(false);
      setDisconnecting(false);
    }
    if (event.type === "response.received") {
      setResponse(event.value);
      if (event.value && typeof event.value === "object") {
        const value = event.value as Record<string, unknown>;
        const list = value.tools ?? value.resources ?? value.prompts;
        if (Array.isArray(list)) {
          setEntries((current) => [...current, ...list]);
          setCursor(
            typeof value.nextCursor === "string" ? value.nextCursor : undefined,
          );
        }
      }
    }
  });
  const draft = (patch: NonNullable<McpEditorRecord["draft"]>) =>
    change({ ...record, draft: { ...record.draft, ...patch } });
  const connect = () =>
    execution.start((requestId) => {
      const config = parseMcpConfig(record);
      if (
        config.transport === "stdio"
          ? !config.command.trim()
          : !record.url?.trim()
      ) {
        throw new Error(
          config.transport === "stdio"
            ? "MCP command is required"
            : "Server URL is required",
        );
      }
      return {
        action: "mcp_connect",
        requestId,
        data: { id: record.id, url: record.url ?? "", config },
      };
    });
  const request = (nextCursor?: string) =>
    execution.start((requestId) => {
      const operation = parseMcpOperation(record, nextCursor);
      if (operation.method.endsWith("/list")) {
        if (!nextCursor) {
          setEntries([]);
        }
        setListMethod(operation.method);
      } else {
        setEntries([]);
        setCursor(undefined);
      }
      return {
        action: "mcp_request",
        requestId,
        data: { id: record.id, operation },
      };
    });
  const disconnect = () => {
    setDisconnecting(true);
    sendRequestPanelMessage({
      action: "mcp_disconnect",
      data: { id: record.id },
    });
  };
  return (
    <ProtocolEditor
      record={record}
      disabled={connected || execution.busy}
      onUrlChange={(url) => change({ ...record, url })}
      actions={
        <button
          disabled={disconnecting}
          onClick={() =>
            connected || execution.busy ? disconnect() : connect()
          }
        >
          {connected || execution.busy ? "断开 Disconnect" : "连接 Connect"}
        </button>
      }
    >
      <ProtocolTabs active={tab} onChange={setTab} requestLabel="请求 Request">
        <span role="status">
          {execution.busy
            ? "处理中…"
            : connected
              ? "● Connected"
              : "Disconnected"}
        </span>
      </ProtocolTabs>
      <ProtocolError error={execution.error} />
      {tab === "headers" && (
        <HeadersEditor
          value={
            record.draft?.headersText ??
            JSON.stringify(record.mcp.headers, null, 2)
          }
          onChange={(headersText) => draft({ headersText })}
        />
      )}
      {tab === "settings" && (
        <div className={styles.settings}>
          <label>
            Transport
            <select
              disabled={connected || execution.busy}
              value={record.mcp.transport}
              onChange={(e) =>
                change({
                  ...record,
                  mcp: {
                    ...record.mcp,
                    transport: e.target
                      .value as McpEditorRecord["mcp"]["transport"],
                  },
                })
              }
            >
              <option value="http">Streamable HTTP</option>
              <option value="sse">SSE</option>
              <option value="stdio">stdio</option>
            </select>
          </label>
          {record.mcp.transport === "stdio" && (
            <>
              <label>
                Command
                <input
                  disabled={connected || execution.busy}
                  value={record.mcp.command}
                  onChange={(e) =>
                    change({
                      ...record,
                      mcp: { ...record.mcp, command: e.target.value },
                    })
                  }
                  placeholder="npx"
                />
              </label>
              <label>
                Arguments (JSON array)
                <textarea
                  disabled={connected || execution.busy}
                  value={
                    record.draft?.argsText ?? JSON.stringify(record.mcp.args)
                  }
                  onChange={(e) => draft({ argsText: e.target.value })}
                />
              </label>
              <p>连接时将在本机启动此命令。</p>
            </>
          )}
        </div>
      )}
      {tab === "request" && (
        <div className={styles.mcpRequest}>
          <div className={styles.address}>
            <select
              aria-label="MCP method"
              disabled={execution.busy}
              value={input.method}
              onChange={(e) => {
                draft({
                  method: e.target.value,
                  name: "",
                  argumentsText: "{}",
                });
                setEntries([]);
                setCursor(undefined);
              }}
            >
              {[
                "tools/list",
                "tools/call",
                "resources/list",
                "resources/read",
                "prompts/list",
                "prompts/get",
              ].map((method) => (
                <option key={method}>{method}</option>
              ))}
            </select>
            <button
              disabled={!connected || execution.busy}
              onClick={() => request()}
            >
              发送 Send
            </button>
          </div>
          {entries.length > 0 && (
            <div className={styles.entries}>
              {entries.map((entry, index) => (
                <button
                  key={index}
                  onClick={() => {
                    draft({
                      method: listMethod.startsWith("tools")
                        ? "tools/call"
                        : listMethod.startsWith("resources")
                          ? "resources/read"
                          : "prompts/get",
                      name: String(entry.name ?? entry.uri ?? ""),
                      argumentsText: "{}",
                    });
                    setEntries([]);
                    setCursor(undefined);
                  }}
                >
                  {String(entry.name ?? entry.uri)}
                  {typeof entry.description === "string" && (
                    <small>{entry.description}</small>
                  )}
                </button>
              ))}
            </div>
          )}
          {cursor && (
            <button
              disabled={execution.busy || !connected}
              onClick={() => request(cursor)}
            >
              加载更多 Load more
            </button>
          )}
          {!input.method.endsWith("/list") && (
            <label className={styles.field}>
              {input.method === "resources/read" ? "Resource URI" : "Name"}
              <input
                value={input.name}
                onChange={(e) => draft({ name: e.target.value })}
              />
            </label>
          )}
          {["tools/call", "prompts/get"].includes(input.method) && (
            <label className={styles.field}>
              Arguments (JSON)
              <textarea
                value={input.argumentsText}
                onChange={(e) => draft({ argumentsText: e.target.value })}
              />
            </label>
          )}
        </div>
      )}
      <ProtocolResponse value={response} />
    </ProtocolEditor>
  );
}
