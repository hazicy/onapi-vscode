import { useRef, useState } from "react";
import type { AiEditorRecord } from "@onapi/domain/requests/record";
import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import { useProtocolExecution } from "../shared/useProtocolExecution";
import {
  ProtocolEditor,
  ProtocolTabs,
  HeadersEditor,
  ProtocolError,
  ProtocolResponse,
} from "../shared/ProtocolEditor";
import { parseAiConfig } from "../shared/request-input";
import styles from "../shared/ProtocolEditor.module.css";

type Props = {
  apisData: AiEditorRecord;
  onApisDataChange: (record: AiEditorRecord) => void;
};
export default function AiDebug({
  apisData: record,
  onApisDataChange: change,
}: Props) {
  const [tab, setTab] = useState("request");
  const [apiKey, setApiKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [text, setText] = useState("");
  const [summary, setSummary] = useState<unknown>(undefined);
  const [outcome, setOutcome] = useState("");
  const streamed = useRef("");
  const conversation = useRef(record.ai.messages);
  const latest = useRef({ record, change });
  latest.current = { record, change };
  const execution = useProtocolExecution(record.id, ({ event }) => {
    if (event.protocol !== "ai") {
      return;
    }
    if (event.type === "response.chunk") {
      streamed.current += event.text;
      setText(streamed.current);
    }
    if (event.type === "response.received") {
      setSummary(event.value);
    }
    if (event.type === "execution.cancelled") {
      setOutcome("已停止 / Cancelled");
    }
    if (event.type === "execution.completed") {
      const current = latest.current;
      if (
        streamed.current &&
        JSON.stringify(current.record.ai.messages) ===
          JSON.stringify(conversation.current)
      ) {
        current.change({
          ...current.record,
          ai: {
            ...current.record.ai,
            messages: [
              ...current.record.ai.messages,
              { role: "assistant", content: streamed.current },
            ],
          },
        });
      }
      streamed.current = "";
      setText("");
    }
  });
  const update = (patch: Partial<AiEditorRecord["ai"]>) =>
    change({ ...record, ai: { ...record.ai, ...patch } });
  const send = () => {
    if (!prompt.trim()) {
      return;
    }
    execution.start((requestId) => {
      const config = parseAiConfig(record);
      if (!config.model.trim()) {
        throw new Error("请输入模型名称 / Model is required");
      }
      // Template URLs are resolved and validated by the host.
      if (!record.url?.trim()) {
        throw new Error("请输入服务器地址 / Server URL is required");
      }
      const messages = [
        ...config.messages,
        { role: "user" as const, content: prompt },
      ];
      conversation.current = messages;
      change({ ...record, ai: { ...record.ai, messages } });
      streamed.current = "";
      setText("");
      setSummary(undefined);
      setOutcome("");
      setPrompt("");
      return {
        action: "ai_send",
        requestId,
        data: {
          id: record.id,
          url: record.url,
          apiKey,
          config: { ...config, messages },
        },
      };
    });
  };
  return (
    <ProtocolEditor
      record={record}
      disabled={execution.busy}
      onUrlChange={(url) => change({ ...record, url })}
      actions={
        <input
          aria-label="Model"
          value={record.ai.model}
          placeholder="Model"
          disabled={execution.busy}
          onChange={(e) => update({ model: e.target.value })}
        />
      }
    >
      <ProtocolTabs active={tab} onChange={setTab} requestLabel="对话 Chat" />
      <ProtocolError error={execution.error} />
      {outcome && <p role="status">{outcome}</p>}
      {tab === "headers" && (
        <HeadersEditor
          value={
            record.draft?.headersText ??
            JSON.stringify(record.ai.headers, null, 2)
          }
          onChange={(headersText) =>
            change({ ...record, draft: { ...record.draft, headersText } })
          }
        />
      )}
      {tab === "settings" && (
        <div className={styles.settings}>
          <label>
            Model
            <input
              value={record.ai.model}
              onChange={(e) => update({ model: e.target.value })}
            />
          </label>
          <label>
            API Key
            <input
              type="password"
              value={apiKey}
              autoComplete="off"
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="仅用于当前面板，不保存"
            />
          </label>
          <label>
            System prompt
            <textarea
              value={record.ai.system}
              onChange={(e) => update({ system: e.target.value })}
            />
          </label>
          <label>
            Temperature
            <input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={record.ai.temperature}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (n >= 0 && n <= 2) {
                  update({ temperature: n });
                }
              }}
            />
          </label>
          <label>
            Max output tokens
            <input
              type="number"
              min="1"
              value={record.ai.maxOutputTokens}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isInteger(n) && n > 0) {
                  update({ maxOutputTokens: n });
                }
              }}
            />
          </label>
        </div>
      )}
      {tab === "request" && (
        <>
          <div className={styles.conversation} aria-live="polite">
            {!record.ai.messages.length && (
              <div className={styles.empty}>
                配置模型和 API Key，然后开始测试 AI 请求。
              </div>
            )}
            {record.ai.messages.map((message, index) => (
              <article key={index}>
                <strong>{message.role === "user" ? "You" : "Assistant"}</strong>
                <pre>{message.content}</pre>
              </article>
            ))}
            {text && (
              <article>
                <strong>Assistant</strong>
                <pre>{text}</pre>
              </article>
            )}
          </div>
          <div className={styles.composer}>
            <textarea
              aria-label="Message"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="输入消息…"
            />
            {execution.busy ? (
              <button
                onClick={() =>
                  sendRequestPanelMessage({
                    action: "ai_stop",
                    data: { executionId: execution.activeId()! },
                  })
                }
              >
                停止 Stop
              </button>
            ) : (
              <button disabled={!prompt.trim()} onClick={send}>
                发送 Send
              </button>
            )}
            <button
              disabled={execution.busy}
              onClick={() => {
                update({ messages: [] });
                setSummary(undefined);
                setOutcome("");
              }}
            >
              清空
            </button>
          </div>
        </>
      )}
      <ProtocolResponse ai value={summary} />
    </ProtocolEditor>
  );
}
