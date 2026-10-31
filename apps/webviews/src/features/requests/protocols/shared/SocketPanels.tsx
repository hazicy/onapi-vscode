import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Input, Popconfirm, Select } from "@/shared/ui/base";
import Button from "@/shared/ui/Button";
import AppIcon from "@/shared/ui/AppIcon";
import styles from "./SocketPanels.module.css";

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
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const index = Math.max(
    0,
    items.findIndex((item) => item.param_id === activeId),
  );
  const commitName = () => {
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
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) {
              return;
            }
            if (event.key === "Enter") {
              event.preventDefault();
              event.stopPropagation();
              commitName();
            } else if (event.key === "Escape") {
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
        disabled={!items.length}
        onClick={() => {
          if (renaming) {
            commitName();
          } else {
            setDraftName(items[index]?.name || "");
            setRenaming(true);
          }
        }}
        aria-label={t("ws.layout.rename_message")}
        title={t("ws.layout.rename_message")}
      >
        <AppIcon icon="pencil" />
      </Button>
      <Button
        type="text"
        mode="icon"
        onClick={() => {
          onAdd();
          setDraftName("");
          setRenaming(true);
        }}
        aria-label={t("ws.layout.add_message")}
        title={t("ws.layout.add_message")}
      >
        <AppIcon icon="plus" />
      </Button>
      <Popconfirm
        title={t("ws.layout.delete_message")}
        description={t("ws.layout.delete_confirm")}
        okText={t("supplement.confirm")}
        cancelText={t("supplement.cancel")}
        disabled={!items.length}
        open={deletingId !== null}
        onOpenChange={(open) =>
          setDeletingId(open ? items[index]?.param_id || null : null)
        }
        onConfirm={() => {
          if (
            deletingId &&
            items.some((item) => item.param_id === deletingId)
          ) {
            onRemove(deletingId);
          }
          setRenaming(false);
        }}
      >
        <Button
          type="text"
          mode="icon"
          disabled={!items.length}
          aria-label={t("ws.layout.delete_message")}
          title={t("ws.layout.delete_message")}
        >
          <AppIcon icon="trash-2" />
        </Button>
      </Popconfirm>
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
