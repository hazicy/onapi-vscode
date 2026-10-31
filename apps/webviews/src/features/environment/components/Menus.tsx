import { saveEnvironments } from "@/features/requests/events/env";
import styles from "./Environment.module.css";
import clsx from "clsx";
import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { Flex, Popconfirm, message } from "@/shared/ui/base";

import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { cloneDeep, findIndex, head, includes, isEqual } from "lodash-es";
import { useShallow } from "zustand/react/shallow";

import { Tooltip } from "@/shared/ui";
import AppIcon from "@/shared/ui/AppIcon";
import { copyEnv } from "@/features/requests/events/env";
import useProjectConfig from "@/features/project/store/useProjectConfig";

import DraggableMenu from "./DraggableMenu/DraggableMenu";
import { DraggableMenuProps } from "./DraggableMenu/types";
import {
  ENV_MANAGE_ENUM,
  MENU_ITEMS,
  MENU_ITEMS_KEY,
} from "@onapi/domain/environment";

import type { EnvironmentScope as EnvListItem } from "@onapi/domain";

interface Props {
  selectedKeys: string[];
  setSelectedKeys: (keys: string[]) => void;
}

type MenuItem = {
  label: React.ReactNode;
  key: React.Key | ENV_MANAGE_ENUM;
  icon?: string;
  children?: MenuItem[];
  type?: string | undefined;
  isEnv?: boolean;
  disableDraggable?: boolean;
};

const Menus: FC<Props> = ({ selectedKeys, setSelectedKeys }) => {
  const { projectId: project_id } = useParams();
  const { t } = useTranslation();

  const { envList, updateHttpEnvironments } = useProjectConfig(
    useShallow((state) => ({
      envList: state.http!.environments,
      updateHttpEnvironments: state.updateHttpEnvironments,
    })),
  );

  const getLogo = (str: string) => {
    if (str.length < 2) {
      return str;
    }
    // Get the first character
    const firstChar = str?.[0];

    // Check if the first character is a number
    if (!isNaN(+firstChar)) {
      // If it's a number, take the first two characters
      return `${str}`.substring(0, 2);
    } else {
      // If it's a letter or character, take only the first character
      return firstChar;
    }
  };

  const getItem = ({
    label,
    key,
    icon,
    children,
    type,
    isEnv,
  }: MenuItem): MenuItem => {
    return {
      label: <span className={styles.menuChildTitle}>{label}</span>,
      key,
      icon: icon ? (
        isEnv ? (
          <div className={styles.envIcon}>{icon}</div>
        ) : (
          <span className={styles.menuIcon}>
            <div className={icon}>
              <AppIcon className={clsx(icon, styles.icon)} icon={icon} />
            </div>
          </span>
        )
      ) : null,
      children,
      type,
    } as unknown as MenuItem;
  };

  const items = useMemo(() => {
    const envItems = envList?.map(({ id, name, isLocal }) => ({
      key: id,
      icon: getLogo(name || ""),
      label: (
        <div className={styles.envLabel}>
          <Flex
            justify="start"
            align="center"
            flex={1}
            style={{ width: "10%" }}
          >
            <Tooltip title={name}>
              <span className={[styles.name, undefined].join(" ")}>{name}</span>
            </Tooltip>
          </Flex>
          <div className="operation-content">
            <span className={styles.operation}>
              {id !== "2" && !isLocal && (
                <AppIcon
                  onClick={(e) => {
                    e.stopPropagation();
                    copyEnv({ id, project_id: `${project_id}` });
                  }}
                  icon="copy"
                  className={styles.icon}
                />
              )}
              {!includes(["1", "2"], id) && (
                <Popconfirm
                  title={t("supplement.confirm_del1")}
                  onConfirm={() => {
                    if (isLocal) {
                      const res = envList.filter((e) => !e.isLocal);
                      if (res.length && head(selectedKeys) === id) {
                        setSelectedKeys([res[res.length - 1].id]);
                      }
                      if (!res.length) {
                        setSelectedKeys([ENV_MANAGE_ENUM.cookie]);
                      }
                      updateHttpEnvironments(res);
                      return;
                    }
                    delEnv(id);
                  }}
                >
                  <AppIcon icon="trash-2" className={styles.icon} />
                </Popconfirm>
              )}
            </span>
          </div>
        </div>
      ),
    }));

    return MENU_ITEMS.map(
      ({ key, icon, children, type, disableDraggable }: MenuItem) => ({
        label: (
          <span className={styles.menuTitle}>
            {t(
              key === MENU_ITEMS_KEY.all
                ? "global_setting.global_title"
                : "global_setting.environment_list",
            )}
          </span>
        ),
        key,
        icon: icon ? (
          <AppIcon className={clsx(icon, styles.icon)} icon={icon} />
        ) : null,
        children:
          key === MENU_ITEMS_KEY.all
            ? children &&
              children.map((e) =>
                getItem({
                  ...e,
                  label: t(
                    e.key === ENV_MANAGE_ENUM.cookie
                      ? "global_setting.cookie"
                      : e.key === ENV_MANAGE_ENUM.globalParm
                        ? "global_setting.global_key"
                        : "global_setting.global_variables",
                  ),
                }),
              )
            : envItems.map((e) => getItem({ ...e, isEnv: true })),
        type,
        disableDraggable,
      }),
    );
  }, [envList, selectedKeys, t]);

  const delEnv = async (id: string) => {
    try {
      const res = envList?.filter((e) => e.id !== id);
      if (res.length) {
        if (head(selectedKeys) === id) {
          const index = envList?.findIndex((e) => e.id === id) - 1;
          if (index >= 0) {
            setSelectedKeys([res[index].id]);
          } else {
            setSelectedKeys([res[0].id]);
          }
        }
      } else {
        setSelectedKeys([ENV_MANAGE_ENUM.cookie]);
      }
      saveEnvironments(res);
    } catch (err) {
      /* empty */
    }
  };

  const onSelect: DraggableMenuProps["onSelect"] = (selectedKeys) => {
    setSelectedKeys(selectedKeys as string[]);
  };

  const handleMoveEnv = (envList: EnvListItem[]) => {
    const newEnvList = cloneDeep(envList);
    newEnvList.forEach((item, index) => {
      item.sort = index + 1;
    });

    saveEnvironments(newEnvList);
    updateHttpEnvironments(newEnvList);
    message.success(t("supplement.move_success"));
    // multiMoveEnvRequest({
    //   project_id: project_id || '',
    //   ids: [activeId],
    //   before_id: beforeId,
    //   after_id: afterId,
    // }).then(async () => {
    //   message.success(t('supplement.move_success'));

    //   await getEnvList(project_id || '');
    // });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (isEqual(active.id, over?.id)) {
      return;
    }

    const activeIndex = findIndex(envList, (i) => i.id === active.id);
    const overIndex = findIndex(envList, (i) => i.id === over?.id);
    const newEnvList = arrayMove(envList || [], +activeIndex, +overIndex);
    handleMoveEnv(newEnvList);
  };

  return (
    <DraggableMenu
      items={items}
      selectedKeys={selectedKeys}
      onSelect={onSelect}
      onDragEnd={onDragEnd}
    />
  );
};

export default Menus;
