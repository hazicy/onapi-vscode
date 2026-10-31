import { useTranslation } from "react-i18next";
import styles from "./ParamsManage.module.css";
import RequestGlobal from "@/features/requests/editor/RequestGlobal";
import Button from "@/shared/ui/Button";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import { saveProjectConfig } from "@/features/requests/events/env";
import { useEffect, useRef, useState } from "react";
import { isEqual } from "lodash-es";

export default function ParamsManage({
  defaultTabKey = "Headers",
}: {
  defaultTabKey?: string;
}) {
  const { t } = useTranslation();
  const collection = useProjectConfig((state) => state.http.collection);
  const [draft, setDraft] = useState(() => structuredClone(collection));
  const [saved, setSaved] = useState(() => structuredClone(collection));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const pending = useRef<{
    id: string;
    snapshot: typeof collection;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);
  const dirty = !isEqual(draft, saved);

  // Accept host updates only while there are no local edits to overwrite.
  useEffect(() => {
    if (!pending.current && isEqual(draft, saved)) {
      setDraft(structuredClone(collection));
      setSaved(structuredClone(collection));
    }
  }, [collection]);

  useEffect(() => {
    const receive = ({ data }: MessageEvent) => {
      if (
        !pending.current ||
        data?.action !== "projectConfigSaved" ||
        data.requestId !== pending.current.id
      ) {
        return;
      }
      clearTimeout(pending.current.timer);
      if (data.success === true) {
        setSaved(pending.current.snapshot);
        setStatus("saved");
      } else {
        setStatus("error");
      }
      pending.current = null;
    };
    window.addEventListener("message", receive);
    return () => {
      window.removeEventListener("message", receive);
      if (pending.current) {
        clearTimeout(pending.current.timer);
      }
    };
  }, []);

  const save = () => {
    if (pending.current || !dirty) {
      return;
    }
    const snapshot = structuredClone(draft);
    setStatus("saving");
    try {
      const http = useProjectConfig.getState().http;
      const id = saveProjectConfig("http", { ...http, collection: snapshot });
      const timer = setTimeout(() => {
        pending.current = null;
        setStatus("error");
      }, 10000);
      pending.current = { id, snapshot, timer };
    } catch {
      setStatus("error");
    }
  };

  const statusKey =
    status === "error"
      ? "save_failed"
      : status === "saving"
        ? "saving"
        : dirty
          ? "unsaved"
          : status === "saved"
            ? "saved"
            : null;
  return (
    <section
      className={styles.container}
      aria-label={t("global_setting.global_key")}
    >
      <header className={styles.header}>
        <div className={styles.heading}>
          <h1>{t("global_setting.global_key")}</h1>
          <span className={styles.scope}>
            {t("global_setting.public_config.scope")}
          </span>
        </div>
        <div className={styles.actions}>
          <span
            className={styles.status}
            role={status === "error" ? "alert" : "status"}
          >
            {statusKey && t(`global_setting.public_config.${statusKey}`)}
          </span>
          <Button
            onClick={save}
            type="primary"
            disabled={!dirty || status === "saving"}
          >
            {t("global_setting.key_detail.save")}
          </Button>
        </div>
      </header>
      <div className={styles.paramsContent}>
        <RequestGlobal
          defaultTabKey={defaultTabKey}
          item={draft}
          onItemChange={(next) => {
            setDraft(next);
            if (status !== "saving") {
              setStatus("idle");
            }
          }}
        />
      </div>
    </section>
  );
}
