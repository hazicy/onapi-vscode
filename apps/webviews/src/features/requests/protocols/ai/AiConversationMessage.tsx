import { useTranslation } from "react-i18next";
import { Streamdown } from "streamdown";
import { aiProviders, type AiMessage } from "@onapi/domain/requests/ai-mcp";
import AppIcon from "@/shared/ui/AppIcon";
import styles from "./AiDebug.module.css";

function AiMarkdown({
  children,
  streaming,
  busy,
}: {
  children: string;
  streaming: boolean;
  busy: boolean;
}) {
  return (
    <Streamdown
      className={styles.markdown}
      mode={streaming ? "streaming" : "static"}
      isAnimating={busy && streaming}
      controls={false}
    >
      {children}
    </Streamdown>
  );
}

type Props = {
  message: AiMessage;
  index?: number;
  busy: boolean;
  editing: boolean;
  onToggleEdit: () => void;
  onEdit: (content: string) => void;
  onDelete: () => void;
  onError: (message: string) => void;
};

export default function AiConversationMessage({
  message,
  index,
  busy,
  editing,
  onToggleEdit,
  onEdit,
  onDelete,
  onError,
}: Props) {
  const { t } = useTranslation();
  const label = (key: string) => t(`ai_panel.${key}`);
  return (
    <article
      className={styles.message}
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
                onClick={() => onToggleEdit()}
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
                onClick={onDelete}
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
          <AiMarkdown streaming={index === undefined} busy={busy}>
            {message.reasoning}
          </AiMarkdown>
        </details>
      )}
      {index !== undefined && editing ? (
        <textarea
          className={styles.messageEdit}
          aria-label={`${label("edit")} ${index + 1}`}
          value={message.content}
          disabled={busy}
          onChange={(e) => onEdit(e.target.value)}
        />
      ) : message.role === "assistant" ? (
        <AiMarkdown streaming={index === undefined} busy={busy}>
          {message.content}
        </AiMarkdown>
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
}
