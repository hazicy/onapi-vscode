import RequestToolbar from "@/features/requests/components/RequestToolbar";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AiMessage } from "@onapi/domain/requests/ai-mcp";
import AiConversationMessage from "./AiConversationMessage";
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
    <AiConversationMessage
      key={index ?? "streaming"}
      message={message}
      index={index}
      busy={busy}
      editing={index !== undefined && editIndex === index}
      onToggleEdit={() =>
        setEditIndex(editIndex === index ? null : (index ?? null))
      }
      onEdit={(content) =>
        onChange(
          messages.map((item, i) =>
            i === index ? { role: item.role, content } : item,
          ),
        )
      }
      onDelete={() => {
        setEditIndex(null);
        onChange(messages.filter((_, i) => i !== index));
      }}
      onError={onError}
    />
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
