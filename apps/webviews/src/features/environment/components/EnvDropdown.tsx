import styles from "./EnvDropdown.module.css";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  Divider,
  Dropdown,
  DropdownProps,
  Flex,
  Input,
  MenuProps,
} from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import clsx from "clsx";
import { map } from "lodash-es";

import Button from "@/shared/ui/Button";
import AppIcon from "@/shared/ui/AppIcon";
import Tooltip from "@/shared/ui/Tooltip";
import { getProjectConfig, openEnvPage } from "@/features/requests/events/env";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import type { EnvironmentScope as EnvListItem } from "@onapi/domain";

type EnvDropdownProps = {
  value: string;
  onEnvClick: MenuProps["onClick"];
  isApis?: boolean;
  disabled?: boolean;
  style?: any;
};

const EnvDropdown: React.FC<EnvDropdownProps> = ({
  value,
  onEnvClick,
  disabled = false,
  style,
}: EnvDropdownProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useSafeState<boolean>(false);
  const [filterValue, setFilterValue] = useSafeState<string>("");
  const envList = useProjectConfig((state) => state.http!.environments);
  const updateEstablish = useProjectConfig((state) => state.updateEstablish);
  const updateEnvSettingKeys = useProjectConfig(
    (state) => state.updateEnvSettingKeys,
  );
  const envDetails = useMemo(() => {
    return envList.find((e) => e.id === value);
  }, [envList, value]);

  const filterList = useMemo(() => {
    return envList.filter(
      (d) =>
        `${d.name}`.toLowerCase().indexOf(`${filterValue}`.toLowerCase()) !==
        -1,
    );
  }, [filterValue, envList]);

  const envDisabled = disabled;

  const envCreate = async () => {
    updateEstablish(true);
    setOpen(false);
    openEnvPage({
      create: true,
    });
  };

  const onOpenChange: DropdownProps["onOpenChange"] = async (open) => {
    // Fetch latest data when opening
    if (open) {
      getProjectConfig();
    }
    setOpen(open);
    if (!open) {
      setFilterValue("");
    }
  };

  const dropdownRender: DropdownProps["dropdownRender"] = (menu) => {
    return (
      <div className={styles.envDropdownRender}>
        <Input
          className={styles.envPopoverInput}
          placeholder={t("supplement.env_input_tip")}
          prefix={<AppIcon icon="search" className={styles.icon} />}
          value={filterValue}
          onChange={(event) => setFilterValue(event.target.value)}
        />
        {menu}
        <Divider style={{ margin: "8px 0" }} />
        <Flex style={{ padding: "4px 0" }}>
          <Button
            onClick={envCreate}
            icon={<AppIcon icon="circle-plus" className={styles.icon} />}
            type="link"
            size="small"
            className={styles.addEnvBtn}
          >
            {t("supplement.env_create")}
          </Button>
        </Flex>
      </div>
    );
  };

  const dropdownMenuRender = ({ id, name }: EnvListItem) => {
    return (
      <div className={styles.envLabel}>
        <Flex className="menu-item-wrap" align="center" justify="space-between">
          <Tooltip placement="bottom" title={name}>
            <span className={styles.name}>{name}</span>
          </Tooltip>
          <Flex gap={8} align="center" className={styles.operateWrap}>
            <AppIcon
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                // Open environment page
                openEnvPage({
                  id,
                });

                updateEnvSettingKeys(id);
              }}
              icon="settings"
              className={styles.icon}
            />
          </Flex>
        </Flex>
      </div>
    );
  };

  return (
    <Flex
      style={style}
      align="center"
      className={clsx(
        styles.container,
        envDisabled && styles.envDropdownDisabled,
      )}
    >
      <Dropdown
        disabled={envDisabled}
        menu={{
          items: [
            { key: "", label: t("interaction.noEnvironment") },
            ...map(filterList, ({ id, name, isLocal }) => ({
              key: id,
              label: dropdownMenuRender({ id, name, isLocal }),
            })),
          ],
          onClick: onEnvClick,
          selectedKeys: envDetails ? [envDetails.id] : value ? [] : [""],
        }}
        onOpenChange={onOpenChange}
        open={open}
        dropdownRender={dropdownRender}
        className={styles.envSelectWrap}
        trigger={["click"]}
        itemClassName={styles.dropdownMenuItem}
        overlayClassName={styles.dropdownMenu}
      >
        <Flex
          aria-label={t("interaction.environment")}
          id="tour-version-once"
          style={{ height: "100%", width: "100%" }}
          gap={4}
          align="center"
          justify="space-between"
        >
          <Flex align="center" gap={4}>
            <AppIcon
              className={clsx(styles.envSelectSetting, styles.icon)}
              onClick={(e) => {
                if (envDisabled) {
                  return;
                }
                e.stopPropagation();
                setOpen(false);
                // Open environment page
                openEnvPage({
                  id: envDetails?.id,
                });
                if (envDetails) {
                  updateEnvSettingKeys(envDetails.id);
                }
              }}
              style={{ fontSize: 12, color: "var(--icon-color)" }}
              icon="settings"
            />
            <span className={styles.title}>
              <Tooltip
                title={
                  envDetails?.name ||
                  t(
                    value
                      ? "interaction.environmentMissingHint"
                      : "interaction.noEnvironment",
                  )
                }
              >
                <i className={styles.name}>
                  {envDetails?.name ||
                    t(
                      value
                        ? "interaction.environmentMissing"
                        : "interaction.noEnvironment",
                    )}
                </i>
              </Tooltip>
            </span>
          </Flex>
          <AppIcon
            icon="chevron-down"
            style={{ color: "var(--icon-color)" }}
            className={styles.icon}
          />
        </Flex>
      </Dropdown>

      <div
        onClick={() => {
          if (envDisabled) {
            return;
          }
          setOpen(false);
          openEnvPage({ cookie: true });
        }}
        className={styles.iconManageEnv}
      >
        <AppIcon icon="sliders-horizontal" className={styles.icon} />
      </div>
    </Flex>
  );
};

export default EnvDropdown;
