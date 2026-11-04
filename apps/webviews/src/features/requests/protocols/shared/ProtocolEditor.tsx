import { useTranslation } from "react-i18next";
import RequestToolbar from "@/features/requests/components/RequestToolbar";
import React from "react";
import type {
  AiEditorRecord,
  McpEditorRecord,
} from "@onapi/domain/requests/record";
import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import styles from "../shared/ProtocolEditor.module.css";

export function ProtocolEditor({
  record,
  onUrlChange,
  disabled,
  actions,
  children,
}: {
  record: AiEditorRecord | McpEditorRecord;
  onUrlChange: (url: string) => void;
  disabled: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <section className={styles.workspace}>
      <RequestToolbar as="header" className={styles.address}>
        <strong>{record.kind.toUpperCase()}</strong>
        <input
          aria-label={t("ui.server_url")}
          value={record.url ?? ""}
          disabled={disabled}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder={
            record.kind === "ai"
              ? "https://api.openai.com/v1"
              : "https://server.example/mcp"
          }
        />
        <button
          onClick={() =>
            sendRequestPanelMessage({ action: "saveApiData", data: record })
          }
        >
          {t("ui.save")}
        </button>
        {actions}
      </RequestToolbar>
      {children}
    </section>
  );
}
export function HeadersEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <label className={styles.field}>
      {t("ui.headers_json")}
      <textarea
        aria-label={t("ui.headers_json")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
export function ProtocolError({ error }: { error: string }) {
  return error ? (
    <div role="alert" className={styles.error}>
      {error}
    </div>
  ) : null;
}
export function ProtocolResponse({
  value,
  ai = false,
}: {
  value: unknown;
  ai?: boolean;
}) {
  const { t } = useTranslation();

  return value !== undefined ? (
    <details className={styles.response} open={!ai}>
      <summary>{ai ? t("ui.response_usage") : t("ui.response")}</summary>
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </details>
  ) : null;
}
