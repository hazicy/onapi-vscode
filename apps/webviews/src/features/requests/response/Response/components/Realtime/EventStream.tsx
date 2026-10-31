import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { parseEventStream } from "@/features/requests/execution/event-stream";
import styles from "./EventStream.module.css";

export default function EventStream({
  body,
  error,
}: {
  body: string;
  error?: string;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [raw, setRaw] = useState(false);
  const [cleared, setCleared] = useState(0);
  const [rawOffset, setRawOffset] = useState(0);
  const events = useMemo(() => parseEventStream(body), [body]);
  const visible = events
    .slice(cleared)
    .filter((event) =>
      `${event.event}\n${event.id || ""}\n${event.data}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  return (
    <section className={styles.container} aria-label={t("event_stream.title")}>
      {error && <p role="alert">{error}</p>}
      <div className={styles.toolbar}>
        <input
          aria-label={t("event_stream.search")}
          placeholder={t("event_stream.search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" aria-pressed={raw} onClick={() => setRaw(!raw)}>
          {raw ? t("event_stream.events") : t("event_stream.raw")}
        </button>
        <button
          type="button"
          onClick={() => {
            setCleared(events.length);
            setRawOffset(body.length);
          }}
        >
          {t("event_stream.clear")}
        </button>
      </div>
      {raw ? (
        <pre>{body.slice(rawOffset)}</pre>
      ) : visible.length ? (
        visible.map((event, index) => (
          <article className={styles.event} key={cleared + index}>
            <header>
              <strong>{event.event}</strong>
              {event.id !== undefined && <span>ID: {event.id || "—"}</span>}
            </header>
            <pre>{event.data}</pre>
          </article>
        ))
      ) : (
        <p className={styles.empty}>
          {t(query ? "event_stream.no_matches" : "event_stream.waiting")}
        </p>
      )}
    </section>
  );
}
