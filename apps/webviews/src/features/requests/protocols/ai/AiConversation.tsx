import RequestToolbar from "@/features/requests/components/RequestToolbar";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Streamdown } from "streamdown";
import type { AiMessage } from "@onapi/domain/requests/ai-mcp";
import { aiProviders } from "@onapi/domain/requests/ai-mcp";
import AppIcon from "@/shared/ui/AppIcon";
import { ProtocolError } from "../shared/ProtocolEditor";
import styles from "./AiDebug.module.css";

type Props = {
  messages: AiMessage[];
  partial: { text: string; reasoning: string };
  busy: boolean;
  error: string;
  outcome: string;
  onChange: (messages: AiMessage[]) => void;
  onRetry: () => void;
  onClear: () => void;
  onConfigure: () => void;
  onError: (message: string) => void;
};

export default function AiConversation({
  messages,
  partial,
  busy,
  error,
  outcome,
  onChange,
  onRetry,
  onClear,
  onConfigure,
  onError,
}: Props) {
  const { t } = useTranslation();
  const label = (key: string) => t(`ai_panel.${key}`);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (busy) {
      setEditIndex(null);
    }
  }, [busy]);
  useEffect(() => {
    if (log.current && log.current.scrollTop < 120) {
      log.current.scrollTop = 0;
    }
  }, [messages.length, partial]);
  const renderMessage = (message: AiMessage, index?: number) => (
    <article
      className={styles.message}
      key={index ?? "streaming"}
      aria-label={
        message.role === "user" ? label("sent_message") : label("response")
      }
    >
      <div className={styles.messageHeader}>
        <strong className={styles.messageTitle}>
          <AppIcon icon={message.role === "user" ? "arrow-up" : "arrow-down"} />
          {message.role === "user" ? label("sent_message") : label("response")}
        </strong>
        <div className={styles.messageMeta}>
          {message.result && (
            <>
              <span
                className={
                  message.result.state === "completed"
                    ? styles.success
                    : styles.resultState
                }
              >
                {label(message.result.state)}
              </span>
              <span>
                {aiProviders[message.result.provider].name} ·{" "}
                {message.result.model}
              </span>
              <span>{(message.result.durationMs / 1000).toFixed(2)}s</span>
              <span title={label("total")}>
                {message.result.usage.totalTokens ?? "—"} tokens
              </span>
              <time
                dateTime={new Date(message.result.completedAt).toISOString()}
              >
                {new Date(message.result.completedAt).toLocaleTimeString()}
              </time>
            </>
          )}
          {index !== undefined && (
            <div className={styles.messageActions}>
              <button
                type="button"
                className={styles.quiet}
                disabled={busy}
                aria-label={`${label("edit")} ${index + 1}`}
                onClick={() => setEditIndex(editIndex === index ? null : index)}
              >
                <AppIcon icon="pencil" />
              </button>
              <button
                type="button"
                className={styles.quiet}
                aria-label={`${label("copy")} ${index + 1}`}
                onClick={() =>
                  navigator.clipboard
                    .writeText(message.content)
                    .catch(() => onError(label("copy_failed")))
                }
              >
                <AppIcon icon="copy" />
              </button>
              <button
                type="button"
                className={styles.quiet}
                disabled={busy}
                aria-label={`${label("delete")} ${index + 1}`}
                onClick={() => {
                  setEditIndex(null);
                  onChange(messages.filter((_, i) => i !== index));
                }}
              >
                <AppIcon icon="trash-2" />
              </button>
            </div>
          )}
        </div>
      </div>
      {message.reasoning && (
        <details className={styles.reasoning} open={index === undefined}>
          <summary>{label("reasoning")}</summary>
          <Streamdown
            className={styles.markdown}
            mode={index === undefined ? "streaming" : "static"}
            isAnimating={busy && index === undefined}
            controls={false}
          >
            {message.reasoning}
          </Streamdown>
        </details>
      )}
      {index !== undefined && editIndex === index ? (
        <textarea
          className={styles.messageEdit}
          aria-label={`${label("edit")} ${index + 1}`}
          value={message.content}
          disabled={busy}
          onChange={(e) =>
            onChange(
              messages.map((item, i) =>
                i === index
                  ? { role: item.role, content: e.target.value }
                  : item,
              ),
            )
          }
        />
      ) : message.role === "assistant" ? (
        <Streamdown
          className={styles.markdown}
          mode={index === undefined ? "streaming" : "static"}
          isAnimating={busy && index === undefined}
          controls={false}
        >
          {message.content}
        </Streamdown>
      ) : (
        <pre className={styles.messageContent}>{message.content}</pre>
      )}
      {message.result && (
        <details className={styles.responseDetails}>
          <summary>{label("usage")} · JSON</summary>
          <dl className={styles.metrics}>
            {[
              [label("input"), message.result.usage.inputTokens],
              [label("output"), message.result.usage.outputTokens],
              [label("total"), message.result.usage.totalTokens],
              [label("finish"), message.result.finishReason],
            ].map(([title, value]) => (
              <div key={title}>
                <dt>{title}</dt>
                <dd>{value ?? "—"}</dd>
              </div>
            ))}
          </dl>
          <pre>{JSON.stringify(message, null, 2)}</pre>
        </details>
      )}
    </article>
  );
  return (
    <section className={styles.history} aria-label={label("conversation")}>
      <RequestToolbar as="header" className={styles.chatToolbar}>
        <strong>{label("conversation")}</strong>
        <div>
          <button
            type="button"
            className={styles.quiet}
            disabled={busy || !messages.length}
            onClick={onRetry}
          >
            <AppIcon icon="refresh-cw" /> {label("retry")}
          </button>
          <button
            type="button"
            className={styles.quiet}
            disabled={busy || !messages.length}
            onClick={() => {
              setEditIndex(null);
              onClear();
            }}
          >
            <AppIcon icon="trash-2" /> {label("clear")}
          </button>
        </div>
      </RequestToolbar>
      <ProtocolError error={error} />
      {outcome && (
        <p className={styles.status} role="status">
          {outcome}
        </p>
      )}
      <div
        ref={log}
        className={styles.conversation}
        role="log"
        aria-label={label("conversation")}
        aria-live="polite"
      >
        {(partial.text || partial.reasoning) &&
          renderMessage({
            role: "assistant",
            content: partial.text,
            ...(partial.reasoning ? { reasoning: partial.reasoning } : {}),
          })}
        {busy && !partial.text && !partial.reasoning && (
          <p className={styles.pending} role="status">
            {label("generating")}
          </p>
        )}
        {messages
          .map((message, index) => ({ message, index }))
          .reverse()
          .map(({ message, index }) => renderMessage(message, index))}
        {!messages.length && !busy && (
          <div className={styles.empty}>
            <AppIcon icon="sparkles" />
            <h2>{label("empty_title")}</h2>
            <p>{label("empty_help")}</p>
            <button
              type="button"
              className={styles.quiet}
              onClick={onConfigure}
            >
              {label("configure_key")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
