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
  return (
    <section className={styles.workspace}>
      <header className={styles.address}>
        <strong>{record.kind.toUpperCase()}</strong>
        <input
          aria-label="Server URL"
          value={record.url ?? ""}
          disabled={disabled}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder={
            record.kind === "ai"
              ? "https://api.openai.com/v1"
              : "https://server.example/mcp"
          }
        />
        {actions}
        <button
          onClick={() =>
            sendRequestPanelMessage({ action: "saveApiData", data: record })
          }
        >
          保存 Save
        </button>
      </header>
      {children}
    </section>
  );
}
export function ProtocolTabs({
  active,
  onChange,
  requestLabel,
  children,
}: {
  active: string;
  onChange: (tab: string) => void;
  requestLabel: string;
  children?: React.ReactNode;
}) {
  return (
    <nav className={styles.tabs} aria-label="Request tabs">
      {[
        ["request", requestLabel],
        ["settings", "设置 Settings"],
        ["headers", "Headers"],
      ].map(([key, label]) => (
        <button
          key={key}
          aria-pressed={active === key}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
      {children}
    </nav>
  );
}
export function HeadersEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={styles.field}>
      Headers (JSON)
      <textarea
        aria-label="Headers JSON"
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
  return value !== undefined ? (
    <details className={styles.response} open={!ai}>
      <summary>{ai ? "响应统计 / Usage" : "响应 / Response"}</summary>
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </details>
  ) : null;
}
