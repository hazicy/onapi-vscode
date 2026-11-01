import RequestToolbar from "@/features/requests/components/RequestToolbar";
import RequestTabs from "@/features/requests/components/RequestTabs";
import RequestAction from "@/features/requests/components/RequestAction";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AiResponseSummary } from "@onapi/contracts";
import {
  aiProviders,
  type AiProvider,
  type AiMessage,
} from "@onapi/domain/requests/ai-mcp";
import type { AiEditorRecord } from "@onapi/domain/requests/record";
import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import AppIcon from "@/shared/ui/AppIcon";
import ResizablePanels from "@/shared/components/ResizablePanels/ResizablePanels";
import { useProtocolExecution } from "../shared/useProtocolExecution";
import { HeadersEditor } from "../shared/ProtocolEditor";
import { parseAiConfig } from "../shared/request-input";
import AiConversation from "./AiConversation";
import shared from "../shared/ProtocolEditor.module.css";
import styles from "./AiDebug.module.css";

type Props = {
  apisData: AiEditorRecord;
  onApisDataChange: (record: AiEditorRecord) => void;
};
type Run = {
  provider: AiProvider;
  model: string;
  startedAt: number;
  cancelled: boolean;
  summary?: AiResponseSummary;
};

export default function AiDebug({
  apisData: record,
  onApisDataChange: change,
}: Props) {
  const { t } = useTranslation();
  const label = (key: string) => t(`ai_panel.${key}`);
  const [tab, setTab] = useState("prompt");
  const [keys, setKeys] = useState<Partial<Record<AiProvider, string>>>({});
  const [partial, setPartial] = useState({ text: "", reasoning: "" });
  const [outcome, setOutcome] = useState("");
  const streamed = useRef({ text: "", reasoning: "" });
  const run = useRef<Run | null>(null);
  const conversation = useRef(record.ai.messages);
  const latest = useRef({ record, change });
  latest.current = { record, change };
  const execution = useProtocolExecution(record.id, ({ event }) => {
    if (event.protocol !== "ai") {
      return;
    }
    if (event.type === "response.chunk") {
      const channel = event.channel === "reasoning" ? "reasoning" : "text";
      streamed.current = {
        ...streamed.current,
        [channel]: streamed.current[channel] + event.text,
      };
      setPartial(streamed.current);
    }
    if (event.type === "response.received" && run.current) {
      run.current.summary = event.value;
    }
    if (event.type === "execution.cancelled") {
      if (run.current) {
        run.current.cancelled = true;
      }
      setOutcome(label("cancelled"));
    }
    if (event.type === "execution.completed") {
      const current = latest.current;
      const { text, reasoning } = streamed.current;
      const info = run.current;
      if (
        info &&
        (text || reasoning || info.summary) &&
        JSON.stringify(current.record.ai.messages) ===
          JSON.stringify(conversation.current)
      ) {
        const state = event.failed
          ? "failed"
          : info.cancelled
            ? "cancelled"
            : "completed";
        current.change({
          ...current.record,
          ai: {
            ...current.record.ai,
            messages: [
              ...current.record.ai.messages,
              {
                role: "assistant",
                content: text,
                ...(reasoning ? { reasoning } : {}),
                result: {
                  provider: info.provider,
                  model: info.model,
                  state,
                  completedAt: Date.now(),
                  durationMs:
                    info.summary?.durationMs ??
                    Math.round(performance.now() - info.startedAt),
                  finishReason: info.summary?.finishReason ?? state,
                  usage: info.summary?.usage ?? {},
                },
              },
            ],
          },
        });
      }
      run.current = null;
      streamed.current = { text: "", reasoning: "" };
      setPartial(streamed.current);
    }
  });
  const update = (patch: Partial<AiEditorRecord["ai"]>) =>
    change({ ...record, ai: { ...record.ai, ...patch } });
  const selectProvider = (provider: AiProvider) => {
    change({
      ...record,
      url: aiProviders[provider].baseURL,
      ai: { ...record.ai, provider, model: aiProviders[provider].models[0] },
    });
    setOutcome("");
  };
  const send = (retry = false) => {
    if (execution.busy || (!retry && !record.ai.prompt.trim())) {
      return;
    }
    execution.start((requestId) => {
      const config = parseAiConfig(record);
      if (!config.model.trim()) {
        throw new Error(label("model_required"));
      }
      if (!record.url?.trim()) {
        throw new Error(label("url_required"));
      }
      const messages: AiMessage[] = retry
        ? config.messages.at(-1)?.role === "assistant"
          ? config.messages.slice(0, -1)
          : config.messages
        : [...config.messages, { role: "user", content: config.prompt }];
      if (!messages.length) {
        throw new Error(label("message_required"));
      }
      conversation.current = messages;
      run.current = {
        provider: config.provider,
        model: config.model,
        startedAt: performance.now(),
        cancelled: false,
      };
      change({ ...record, ai: { ...record.ai, messages } });
      streamed.current = { text: "", reasoning: "" };
      setPartial(streamed.current);
      setOutcome("");
      return {
        action: "ai_send",
        requestId,
        data: {
          id: record.id,
          url: record.url,
          apiKey: keys[config.provider] || "",
          config: { ...config, messages },
        },
      };
    });
  };
  const editor = (
    <RequestTabs
      activeKey={tab}
      onChange={setTab}
      destroyInactiveTabPane
      items={[
        { key: "prompt", label: label("prompt") },
        {
          key: "authorization",
          label: (
            <>
              {label("authorization")}
              {keys[record.ai.provider] && (
                <span
                  className={styles.authIndicator}
                  aria-hidden="true"
                  title={label("key_configured")}
                />
              )}
            </>
          ),
        },
        { key: "parameters", label: label("parameters") },
        { key: "headers", label: label("headers") },
      ]}
    >
      {tab === "prompt" && (
        <div className={styles.promptGrid}>
          <label className={styles.promptField}>
            <span>
              <AppIcon icon="message-square" /> {label("prompt")}
            </span>
            <textarea
              aria-label="Message"
              value={record.ai.prompt}
              onChange={(e) => update({ prompt: e.target.value })}
              placeholder={label("message_placeholder")}
              onKeyDown={(e) => {
                if (
                  (e.metaKey || e.ctrlKey) &&
                  e.key === "Enter" &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <small>{label("shortcut")}</small>
          </label>
          <label className={styles.promptField}>
            <span>
              <AppIcon icon="bot" /> System prompt
            </span>
            <textarea
              aria-label="System prompt"
              value={record.ai.system}
              disabled={execution.busy}
              placeholder={label("system_help")}
              onChange={(e) => update({ system: e.target.value })}
            />
          </label>
        </div>
      )}
      {tab === "authorization" && (
        <div className={styles.settings}>
          <h3>{label("authorization")}</h3>
          <p>{label("auth_help")}</p>
          <label>
            API Key
            <input
              type="password"
              aria-label="API Key"
              autoComplete="off"
              spellCheck={false}
              value={keys[record.ai.provider] || ""}
              disabled={execution.busy}
              placeholder={label("key_placeholder")}
              onChange={(e) =>
                setKeys({ ...keys, [record.ai.provider]: e.target.value })
              }
            />
          </label>
          <small>{label("key_help")}</small>
        </div>
      )}
      {tab === "parameters" && (
        <div className={styles.settings}>
          {record.ai.provider === "openai" && (
            <label>
              {label("api")}
              <select
                aria-label="OpenAI API"
                value={record.ai.openaiApi}
                disabled={execution.busy}
                onChange={(e) =>
                  update({ openaiApi: e.target.value as "responses" | "chat" })
                }
              >
                <option value="responses">Responses API</option>
                <option value="chat">Chat Completions API</option>
              </select>
            </label>
          )}
          {record.ai.provider === "deepseek" && (
            <label>
              {label("thinking_mode")}
              <select
                aria-label="Thinking mode"
                value={record.ai.thinking}
                disabled={execution.busy}
                onChange={(e) =>
                  update({
                    thinking: e.target.value as "auto" | "enabled" | "disabled",
                  })
                }
              >
                <option value="auto">{label("default")}</option>
                <option value="enabled">{label("enabled")}</option>
                <option value="disabled">{label("disabled")}</option>
              </select>
              <small>{label("thinking_help")}</small>
            </label>
          )}
          <div className={styles.parameterGrid}>
            <label>
              Temperature
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={record.ai.temperature}
                disabled={
                  execution.busy ||
                  (record.ai.provider === "deepseek" &&
                    record.ai.thinking !== "disabled")
                }
                onChange={(e) => {
                  const n = e.target.valueAsNumber;
                  if (n >= 0 && n <= 2) {
                    update({ temperature: n });
                  }
                }}
              />
            </label>
            <label>
              {label("max_tokens")}
              <input
                aria-label="Max output tokens"
                type="number"
                min="1"
                value={record.ai.maxOutputTokens}
                disabled={execution.busy}
                onChange={(e) => {
                  const n = e.target.valueAsNumber;
                  if (Number.isInteger(n) && n > 0) {
                    update({ maxOutputTokens: n });
                  }
                }}
              />
            </label>
          </div>
        </div>
      )}
      {tab === "headers" && (
        <fieldset className={styles.headers} disabled={execution.busy}>
          <HeadersEditor
            value={
              record.draft?.headersText ??
              JSON.stringify(record.ai.headers, null, 2)
            }
            onChange={(headersText) =>
              change({ ...record, draft: { ...record.draft, headersText } })
            }
          />
        </fieldset>
      )}
    </RequestTabs>
  );
  return (
    <section
      aria-label={label("workspace")}
      className={`${shared.workspace} ${styles.workspace}`}
    >
      <header className={styles.header}>
        <AppIcon icon="sparkles" className={styles.type} />
        <input
          className={styles.endpoint}
          aria-label="Server URL"
          value={record.url ?? ""}
          disabled={execution.busy}
          onChange={(e) => change({ ...record, url: e.target.value })}
          placeholder={aiProviders[record.ai.provider].baseURL}
        />
        <button
          type="button"
          className={styles.quiet}
          onClick={() =>
            sendRequestPanelMessage({ action: "saveApiData", data: record })
          }
        >
          <AppIcon icon="save" /> {label("save")}
        </button>
      </header>
      <RequestToolbar className={styles.requestBar}>
        <div
          className={styles.modelBar}
          role="group"
          aria-label={label("provider_model")}
        >
          <select
            aria-label="Provider"
            value={record.ai.provider}
            disabled={execution.busy}
            onChange={(e) => selectProvider(e.target.value as AiProvider)}
          >
            {Object.entries(aiProviders).map(([id, provider]) => (
              <option key={id} value={id}>
                {provider.name}
              </option>
            ))}
          </select>
          <input
            aria-label="Model"
            list={`models-${record.id}`}
            value={record.ai.model}
            disabled={execution.busy}
            onChange={(e) => update({ model: e.target.value })}
            placeholder={label("custom_model")}
          />
          <datalist id={`models-${record.id}`}>
            {aiProviders[record.ai.provider].models.map((model) => (
              <option key={model} value={model} />
            ))}
          </datalist>
        </div>
        <RequestAction
          label={label(execution.busy ? "stop" : "send")}
          stopping={execution.busy}
          disabled={
            !execution.busy &&
            (!record.ai.prompt.trim() || !record.ai.model.trim())
          }
          onClick={() => {
            if (execution.busy) {
              const executionId = execution.activeId();
              if (executionId) {
                sendRequestPanelMessage({
                  action: "ai_stop",
                  data: { executionId },
                });
              }
            } else {
              send();
            }
          }}
        />
      </RequestToolbar>
      <div className={styles.panels}>
        <ResizablePanels
          panelGroupProps={{
            direction: "vertical",
            autoSaveId: "ai-request-editor-conversation",
          }}
          leftPanelProps={{ defaultSize: 42, minSize: 20 }}
          rightPanelProps={{ defaultSize: 58, minSize: 20 }}
          panelResizeHandleProps={{ "aria-label": label("resize") }}
          leftPanel={editor}
          rightPanel={
            <AiConversation
              messages={record.ai.messages}
              partial={partial}
              busy={execution.busy}
              error={execution.error}
              outcome={outcome}
              onChange={(messages) => update({ messages })}
              onRetry={() => send(true)}
              onConfigure={() => setTab("authorization")}
              onError={execution.setError}
              onClear={() => {
                update({ messages: [] });
                setOutcome("");
                execution.setError("");
              }}
            />
          }
        />
      </div>
    </section>
  );
}
