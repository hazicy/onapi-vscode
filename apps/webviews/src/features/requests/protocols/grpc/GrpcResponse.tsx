import { useTranslation } from "react-i18next";
import i18next from "i18next";
import RequestToolbar from "@/features/requests/components/RequestToolbar";
import RequestTabs from "@/features/requests/components/RequestTabs";
import { useState } from "react";
import type { GrpcController } from "./useGrpc";
import styles from "./GrpcDebug.module.css";

export function GrpcResponse({ controller }: { controller: GrpcController }) {
  const { t } = useTranslation();

  const [tab, setTab] = useState("messages");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const status = controller.status;
  const messages = controller.messages.filter(
    (message) =>
      (filter === "all" || filter === message.direction) &&
      JSON.stringify(message.value)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <section className={styles.response} aria-label={t("ui.grpc_response")}>
      <RequestToolbar as="header" className={styles.responseHeader}>
        <strong>{t("ui.response")}</strong>
        <div
          role="status"
          className={styles.status}
          data-failed={!!status?.code}
        >
          {controller.cancelled
            ? t("ui.cancelled")
            : status
              ? `${status.code} ${status.name}`
              : controller.busy && controller.phase === "invoke"
                ? t("ui.calling")
                : t("ui.ready")}
        </div>
        {status && <span>{status.durationMs} ms</span>}
        <span>
          {t("ui.grpc_received", { count: controller.receivedCount })}
        </span>
      </RequestToolbar>
      <RequestTabs
        activeKey={tab}
        onChange={setTab}
        keepMounted={false}
        label={t("ui.grpc_response_tabs")}
        items={[
          { key: "messages", label: t("ui.messages") },
          { key: "metadata", label: t("ui.metadata") },
          { key: "trailers", label: t("ui.trailers") },
        ]}
      >
        {tab === "messages" && (
          <>
            <div className={styles.responseTools}>
              <input
                aria-label={t("ui.search_messages")}
                placeholder={t("ui.search_messages")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                aria-label={t("ui.message_filter")}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">{t("ui.all_messages")}</option>
                <option value="received">{t("ui.received")}</option>
                <option value="sent">{t("ui.sent")}</option>
              </select>
              <button
                onClick={controller.clearMessages}
                disabled={!controller.messages.length}
              >
                {t("ui.clear")}
              </button>
            </div>
            {controller.messages.length > 0 &&
              controller.totalMessages > controller.messages.length && (
                <p className={styles.retention}>
                  {t("ui.grpc_retention", {
                    visible: controller.messages.length,
                    total: controller.totalMessages,
                  })}
                </p>
              )}
            {!controller.messages.length ? (
              <div className={styles.responseEmpty}>
                <strong>{t("ui.grpc_empty_response")}</strong>
                <span>{t("ui.grpc_response_help")}</span>
              </div>
            ) : (
              <div className={styles.timeline}>
                {[...messages].reverse().map((message) => (
                  <details
                    key={message.sequence}
                    open
                    className={styles.message}
                  >
                    <summary>
                      <span data-direction={message.direction}>
                        {message.direction === "sent" ? "↑ " : "↓ "}
                        {i18next.t(
                          message.direction === "sent"
                            ? "ui.sent"
                            : "ui.received",
                        )}
                      </span>
                      <time>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </time>
                    </summary>
                    <pre>{JSON.stringify(message.value, null, 2)}</pre>
                  </details>
                ))}
              </div>
            )}
          </>
        )}
        {tab !== "messages" && (
          <div className={styles.responseMetadata}>
            {Object.entries(
              tab === "metadata"
                ? controller.metadata
                : (status?.trailers ?? {}),
            ).length ? (
              <table>
                <tbody>
                  {Object.entries(
                    tab === "metadata"
                      ? controller.metadata
                      : (status?.trailers ?? {}),
                  ).map(([key, values]) => (
                    <tr key={key}>
                      <th>{key}</th>
                      <td>{values.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>
                {i18next.t(
                  tab === "metadata"
                    ? "ui.grpc_no_metadata"
                    : "ui.grpc_no_trailers",
                )}
              </p>
            )}
            {tab === "trailers" && status?.details && <p>{status.details}</p>}
          </div>
        )}
      </RequestTabs>
    </section>
  );
}
