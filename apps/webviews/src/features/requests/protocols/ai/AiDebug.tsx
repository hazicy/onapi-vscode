import RequestToolbar from "@/features/requests/components/RequestToolbar";
import RequestTabs from "@/features/requests/components/RequestTabs";
import RequestAction from "@/features/requests/components/RequestAction";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { aiProviders, type AiProvider } from "@onapi/domain/requests/ai-mcp";
import type { AiEditorRecord } from "@onapi/domain/requests/record";
import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import AppIcon from "@/shared/ui/AppIcon";
import ResizablePanels from "@/shared/components/ResizablePanels/ResizablePanels";
import { useAiConversation } from "./useAiConversation";
import { HeadersEditor } from "../shared/ProtocolEditor";
import AiConversation from "./AiConversation";
import shared from "../shared/ProtocolEditor.module.css";
import styles from "./AiDebug.module.css";

type Props = {
  apisData: AiEditorRecord;
  onApisDataChange: (record: AiEditorRecord) => void;
};
export default function AiDebug({
  apisData: record,
  onApisDataChange: change,
}: Props) {
  const { t } = useTranslation();
  const label = (key: string) => t(`ai_panel.${key}`);
  const [tab, setTab] = useState("prompt");
  const [keys, setKeys] = useState<Partial<Record<AiProvider, string>>>({});
  const conversation = useAiConversation(record, change, keys);
  const { send } = conversation;
  const update = (patch: Partial<AiEditorRecord["ai"]>) =>
    change({ ...record, ai: { ...record.ai, ...patch } });
  const selectProvider = (provider: AiProvider) => {
    change({
      ...record,
      url: aiProviders[provider].baseURL,
      ai: { ...record.ai, provider, model: aiProviders[provider].models[0] },
    });
    conversation.clearOutcome();
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
              disabled={conversation.busy}
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
              disabled={conversation.busy}
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
                disabled={conversation.busy}
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
                disabled={conversation.busy}
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
                  conversation.busy ||
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
                disabled={conversation.busy}
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
        <fieldset className={styles.headers} disabled={conversation.busy}>
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
          disabled={conversation.busy}
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
            disabled={conversation.busy}
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
            disabled={conversation.busy}
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
          label={label(conversation.busy ? "stop" : "send")}
          stopping={conversation.busy}
          disabled={
            !conversation.busy &&
            (!record.ai.prompt.trim() || !record.ai.model.trim())
          }
          onClick={() => {
            if (conversation.busy) {
              conversation.stop();
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
              partial={conversation.partial}
              busy={conversation.busy}
              error={conversation.error}
              outcome={conversation.outcome}
              onChange={(messages) => update({ messages })}
              onRetry={() => send(true)}
              onConfigure={() => setTab("authorization")}
              onError={conversation.setError}
              onClear={conversation.clear}
            />
          }
        />
      </div>
    </section>
  );
}
