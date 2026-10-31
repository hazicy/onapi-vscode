import { useState } from "react";
import type { GrpcController } from "./useGrpc";
import styles from "./GrpcDebug.module.css";

export function GrpcResponse({ controller }: { controller: GrpcController }) {
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
    <section className={styles.response} aria-label="gRPC response">
      <header className={styles.responseHeader}>
        <strong>Response</strong>
        <div
          role="status"
          className={styles.status}
          data-failed={!!status?.code}
        >
          {controller.cancelled
            ? "Cancelled"
            : status
              ? `${status.code} ${status.name}`
              : controller.busy && controller.phase === "invoke"
                ? "Calling…"
                : "Ready"}
        </div>
        {status && <span>{status.durationMs} ms</span>}
        <span>{controller.receivedCount} received</span>
      </header>
      <nav className={styles.responseTabs}>
        {[
          ["messages", "Messages"],
          ["metadata", "Metadata"],
          ["trailers", "Trailers"],
        ].map(([key, title]) => (
          <button
            key={key}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
          >
            {title}
          </button>
        ))}
      </nav>
      {tab === "messages" && (
        <>
          <div className={styles.responseTools}>
            <input
              aria-label="Search messages"
              placeholder="Search messages"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              aria-label="Message filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All messages</option>
              <option value="received">Received</option>
              <option value="sent">Sent</option>
            </select>
            <button
              onClick={controller.clearMessages}
              disabled={!controller.messages.length}
            >
              Clear
            </button>
          </div>
          {controller.messages.length > 0 &&
            controller.totalMessages > controller.messages.length && (
              <p className={styles.retention}>
                Showing the latest {controller.messages.length} of{" "}
                {controller.totalMessages} messages.
              </p>
            )}
          {!controller.messages.length ? (
            <div className={styles.responseEmpty}>
              <strong>Your response will appear here</strong>
              <span>
                Invoke a method to inspect messages, metadata, and trailers.
              </span>
            </div>
          ) : (
            <div className={styles.timeline}>
              {[...messages].reverse().map((message) => (
                <details key={message.sequence} open className={styles.message}>
                  <summary>
                    <span data-direction={message.direction}>
                      {message.direction === "sent" ? "↑ Sent" : "↓ Received"}
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
            tab === "metadata" ? controller.metadata : (status?.trailers ?? {}),
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
            <p>No {tab} returned.</p>
          )}
          {tab === "trailers" && status?.details && <p>{status.details}</p>}
        </div>
      )}
    </section>
  );
}
