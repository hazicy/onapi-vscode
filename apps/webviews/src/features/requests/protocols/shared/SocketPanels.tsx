import { useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Dropdown, Input, Modal, Select } from "@/shared/ui/base";
import Button from "@/shared/ui/Button";
import AppIcon from "@/shared/ui/AppIcon";
import styles from "./SocketPanels.module.css";

export function ConnectionStatus({ status }: { status: string }) {
  const { t } = useTranslation();
  const label = status === "connect"
    ? t("ws.response.connected")
    : status === "connecting"
      ? t("ws.response.connecting")
      : t("ws.response.disconnected");
  return (
    <span className={styles.connectionStatus} data-status={status} role="status" title={label}>
      <span className={styles.statusDot} aria-hidden="true" />
      <span className={styles.statusLabel}>{label}</span>
    </span>
  );
}

export function MessagePresets({
  items,
  activeId,
  onSelect,
  onRename,
  onAdd,
  onRemove,
}: {
  items: { param_id: string; name?: string }[];
  activeId?: string;
  onSelect: (id: string) => void;
  onRename: (index: number, value: { key: string; value: string }) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const { t } = useTranslation();
  const cancelRename = useRef(false);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const index = Math.max(
    0,
    items.findIndex((item) => item.param_id === activeId),
  );
  const commitName = () => {
    if (cancelRename.current) {
      cancelRename.current = false;
      return;
    }
    const item = items[index];
    if (item) {
      onRename(index, {
        key: "name",
        value: draftName.trim() || item.name || t("ws.request.message"),
      });
    }
    setRenaming(false);
  };
  return (
    <div className={styles.presets}>
      <Select
        aria-label={t("ws.layout.saved_messages")}
        placeholder={t("ws.layout.saved_messages")}
        className={styles.presetSelect}
        value={items[index]?.param_id}
        options={items.map((item, index) => ({
          value: item.param_id,
          label: item.name || `${t("ws.request.message")} ${index + 1}`,
        }))}
        onChange={(id) => {
          onSelect(id);
          setRenaming(false);
        }}
      />
      {items[index] && renaming && (
        <Input
          autoFocus
          onBlur={commitName}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) {
              return;
            }
            if (event.key === "Enter") {
              event.preventDefault();
              event.stopPropagation();
              commitName();
            } else if (event.key === "Escape") {
              cancelRename.current = true;
              event.preventDefault();
              event.stopPropagation();
              setRenaming(false);
            }
          }}
          aria-label={t("ws.layout.message_name")}
          className={styles.messageName}
          value={draftName}
          placeholder={t("ws.layout.message_name")}
          onChange={(event) => setDraftName(event.target.value)}
        />
      )}
      <Button
        type="text"
        mode="icon"
        onClick={() => {
          cancelRename.current = false;
          onAdd();
          setDraftName("");
          setRenaming(true);
        }}
        aria-label={t("ws.layout.add_message")}
        title={t("ws.layout.add_message")}
      >
        <AppIcon icon="plus" />
      </Button>
      <Dropdown
        trigger={["click"]}
        disabled={!items.length}
        menu={{
          items: [
            { key: "rename", label: t("ws.layout.rename_message") },
            { key: "delete", label: t("ws.layout.delete_message"), danger: true },
          ],
          onClick: ({ key }) => {
            if (key === "rename") {
              cancelRename.current = false;
              setDraftName(items[index]?.name || "");
              setRenaming(true);
            } else if (key === "delete") {
              setDeletingId(items[index]?.param_id || null);
            }
          },
        }}
      >
        <Button
          type="text"
          mode="icon"
          disabled={!items.length}
          aria-label={t("ws.layout.saved_messages")}
          title={t("ws.layout.saved_messages")}
        >
          <AppIcon icon="ellipsis" />
        </Button>
      </Dropdown>
      <Modal
        title={t("ws.layout.delete_message")}
        width={360}
        open={deletingId !== null}
        okText={t("supplement.confirm")}
        cancelText={t("supplement.cancel")}
        onCancel={() => setDeletingId(null)}
        onOk={() => {
          if (deletingId && items.some((item) => item.param_id === deletingId)) {
            onRemove(deletingId);
          }
          setDeletingId(null);
          setRenaming(false);
        }}
      >
        {t("ws.layout.delete_confirm")}
      </Modal>
    </div>
  );
}

export function SocketTimeline({
  selected,
  onClose,
  list,
  detail,
}: {
  selected: boolean;
  onClose: () => void;
  list: ReactNode;
  detail: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className={styles.timelineShell}>
      <div className={styles.timeline} data-selected={selected}>
        <div className={styles.list}>{list}</div>
        {selected && (
          <section
            className={styles.detail}
            aria-label={t("ws.layout.message_detail")}
          >
            <header>
              <Button type="text" mode="icon" onClick={onClose}>
                <AppIcon icon="arrow-left" />
                {t("ws.layout.back_messages")}
              </Button>
            </header>
            <div className={styles.detailContent}>{detail}</div>
          </section>
        )}
      </div>
    </div>
  );
}
