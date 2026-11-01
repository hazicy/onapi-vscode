import { memo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";

import AppIcon from "@/shared/ui/AppIcon";
import { Checkbox } from "@/shared/ui/base";
import styles from "./KeyValueRow.module.css";

export type KeyValueRowProps = {
  id: string;
  keyEditor: ReactNode;
  valueEditor?: ReactNode;
  extraFields?: ReactNode;
  checked?: boolean;
  showCheckbox?: boolean;
  showDelete?: boolean;
  readOnly?: boolean;
  checkboxDisabled?: boolean;
  draggable?: boolean;
  placeholderRow?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onDelete?: () => void;
  onAdd?: () => void;
};

const KeyValueRow = memo(function KeyValueRow({
  id,
  keyEditor,
  valueEditor,
  extraFields,
  checked = false,
  showCheckbox = true,
  showDelete = true,
  readOnly = false,
  checkboxDisabled = false,
  draggable = true,
  placeholderRow = false,
  onCheckedChange,
  onDelete,
  onAdd,
}: KeyValueRowProps) {
  const { t } = useTranslation();
  const dragDisabled = readOnly || placeholderRow || !draggable;
  const sortable = useSortable({ id, disabled: dragDisabled });

  return (
    <div
      ref={sortable.setNodeRef}
      data-parameter-placeholder={placeholderRow ? "" : undefined}
      onKeyDown={(event) => {
        if (
          readOnly ||
          event.key !== "Enter" ||
          event.nativeEvent.isComposing ||
          event.shiftKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.altKey ||
          !(event.target instanceof HTMLInputElement) ||
          event.target.readOnly ||
          event.target.getAttribute("aria-expanded") === "true"
        ) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (!placeholderRow) {
          event.currentTarget
            .closest("[data-request-parameter-table]")
            ?.querySelector<HTMLInputElement>(
              "[data-parameter-placeholder] [data-parameter-key] input:not([disabled]):not([readonly])",
            )
            ?.focus();
        }
      }}
      className={clsx(styles.row, {
        [styles.dragging]: sortable.isDragging,
        [styles.placeholder]: placeholderRow,
      })}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
    >
      {showCheckbox && (
        <span className={styles.checkbox}>
          {placeholderRow ? (
            <button
              type="button"
              className={styles.placeholderAdd}
              disabled={readOnly || !onAdd}
              aria-label={t("request_panel.add_parameter")}
              onClick={(event) => {
                const row = event.currentTarget.closest(
                  "[data-parameter-placeholder]",
                );
                onAdd?.();
                requestAnimationFrame(() => {
                  row
                    ?.querySelector<HTMLInputElement>(
                      "[data-parameter-key] input",
                    )
                    ?.focus();
                });
              }}
            >
              <AppIcon icon="plus" />
            </button>
          ) : (
            <Checkbox
              checked={checked}
              disabled={readOnly || checkboxDisabled}
              onChange={(event) => onCheckedChange?.(event.target.checked)}
            />
          )}
        </span>
      )}
      <button
        type="button"
        ref={sortable.setActivatorNodeRef}
        className={styles.action}
        disabled={dragDisabled}
        aria-label={t("common.request_table.param_name") + " reorder"}
        {...sortable.attributes}
        {...sortable.listeners}
      >
        <AppIcon icon="grip-vertical" />
      </button>
      <div className={styles.key} data-parameter-key="">
        {keyEditor}
      </div>
      {valueEditor !== undefined && valueEditor !== null && (
        <div className={styles.value}>{valueEditor}</div>
      )}
      {extraFields !== undefined && extraFields !== null && (
        <div className={styles.value}>{extraFields}</div>
      )}
      <div className={styles.operations}>
        {placeholderRow && !readOnly && (
          <span className={styles.enterHint} aria-hidden="true">
            <AppIcon icon="corner-down-left" />
          </span>
        )}
        {showDelete && !readOnly && !placeholderRow && (
          <button
            type="button"
            className={styles.action}
            aria-label={t("common.delete")}
            onClick={onDelete}
          >
            <AppIcon icon="trash-2" />
          </button>
        )}
      </div>
    </div>
  );
});

export default KeyValueRow;
