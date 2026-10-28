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
}: KeyValueRowProps) {
  const { t } = useTranslation();
  const dragDisabled = readOnly || placeholderRow || !draggable;
  const sortable = useSortable({ id, disabled: dragDisabled });

  return (
    <div
      ref={sortable.setNodeRef}
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
        <span
          className={clsx(styles.checkbox, {
            [styles.draftCheckbox]: placeholderRow,
          })}
        >
          <Checkbox
            checked={checked}
            disabled={readOnly || checkboxDisabled}
            onChange={(event) => onCheckedChange?.(event.target.checked)}
          />
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
      <div className={styles.key}>{keyEditor}</div>
      {valueEditor !== undefined && valueEditor !== null && (
        <div className={styles.value}>{valueEditor}</div>
      )}
      {extraFields !== undefined && extraFields !== null && (
        <div className={styles.value}>{extraFields}</div>
      )}
      <div className={styles.operations}>
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
