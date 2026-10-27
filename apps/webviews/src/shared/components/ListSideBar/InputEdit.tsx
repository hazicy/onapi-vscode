import styles from "./ListSideBar.module.css";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  Dropdown,
  Flex,
  Input,
  Popconfirm,
  Typography,
} from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import classnames from "classnames";

import AppIcon from "@/shared/ui/AppIcon";

const { Paragraph } = Typography;
interface Props {
  active: boolean;
  curKey: string;
  label: string;
  canDelete: boolean;
  onSelect: (p: string) => void;
  onEdit?: (data: { key: string; value: string }) => void;
  onRemove?: (key: string) => void;
}
const InputEdit = (props: Props) => {
  const { t } = useTranslation();
  const { active, curKey, label, canDelete, onSelect, onEdit, onRemove } =
    props || {};

  const [edit, setEdit] = useSafeState(true);
  const [value, setValue] = useSafeState(label);

  useEffect(() => {
    setValue(label);
  }, [label, edit]);

  const Items = useMemo(() => {
    const items = [
      {
        key: "edit",
        label: (
          <Flex className={styles.itemLabel}>
            <AppIcon
              icon="pencil"
              style={{ fontSize: "var(--font-size-16)" }}
              className={styles.icon}
            />
            <span>{t("supplement.edit")}</span>
          </Flex>
        ),
        danger: false,
      },
    ];
    canDelete &&
      items.push({
        key: "delete",
        label: (
          <Popconfirm
            title={t("supplement.delete")}
            description={t("supplement.del_this_param")}
            onConfirm={(e) => {
              e?.stopPropagation();
              onRemove?.(curKey);
            }}
            okText={t("supplement.confirm")}
            cancelText={t("supplement.cancel")}
          >
            <Flex className={styles.itemLabel}>
              <AppIcon
                icon="trash-2"
                style={{ fontSize: "var(--font-size-16)" }}
                className={styles.icon}
              />
              <span>{t("supplement.delete")}</span>
            </Flex>
          </Popconfirm>
        ) as any,
        danger: true,
      });
    return items;
  }, [canDelete]);

  return (
    <li
      className={classnames({
        [styles.basicTabBar]: true,
        [styles.basicTabBarActive]: active,
      })}
      onDoubleClick={() => setEdit(false)}
      onClick={() => onSelect?.(curKey)}
    >
      {!edit ? (
        <Input
          size="small"
          className={classnames({
            [styles.editInput]: !edit,
          })}
          style={{ width: 120 }}
          autoFocus
          onBlur={() => {
            onEdit && onEdit({ key: curKey, value: value });
            setEdit(true);
          }}
          onChange={(e) => setValue(e?.target?.value || "")}
          readOnly={edit}
          value={value}
          affixClassName={styles.inputAffixWrapper}
          inputClassName={styles.input}
        />
      ) : (
        <Paragraph ellipsis style={{ marginBottom: 0, width: 120 }}>
          {value}
        </Paragraph>
      )}

      <Dropdown
        getPopupContainer={(triggerNode: HTMLElement) =>
          triggerNode.parentNode as HTMLElement
        }
        menu={{
          items: Items,
          onClick: (node) => {
            node?.domEvent?.stopPropagation();
            if (node.key === "edit") {
              setEdit(false);
              return;
            }
            if (node.key === "delete") {
              // onRemove?.(curKey);
              return;
            }
          },
        }}
        trigger={["click"]}
        itemClassName={styles.dropdownMenuItem}
      >
        <AppIcon
          icon="ellipsis"
          className={styles.iconClose}
          onClick={(e) => {
            e.stopPropagation();
          }}
        />
      </Dropdown>
    </li>
  );
};

export default InputEdit;
