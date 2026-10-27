import styles from "./BaseSettings.module.css";
import React, { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Flex, Select } from "@/shared/ui/base";

import { useMemoizedFn } from "ahooks";
import { find, isEqual, map } from "lodash-es";

import Tooltip from "@/shared/ui/Tooltip";
import useProjectConfig from "@/features/project/store/useProjectConfig";

const optionsContentDefaultStyle: React.CSSProperties = {
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
};

interface Props {
  value: string;
  onChange: (newVal: string) => void;
}

const ServerSelect: FC<Props> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const envList = useProjectConfig((state) => state.envList);
  const envDetailKeys = useProjectConfig((state) => state.envDetailKeys);

  const currentEnv = find(envList, (findItem) =>
    isEqual(findItem.env_id, envDetailKeys),
  );

  const serverList = useMemo(() => currentEnv?.server_list || [], [currentEnv]);

  const handleChange = useMemoizedFn((newVal: string) => {
    onChange(newVal);
  });

  const selectValue = useMemo(() => {
    const currentSelectServer = serverList.find((i) => i?.server_id === value);
    if (currentSelectServer !== undefined) {
      return value;
    }
    return "0";
  }, [serverList, value]);

  return (
    <Select
      value={selectValue}
      onChange={handleChange}
      optionLabelProp="label"
      className={styles.select}
    >
      <Select.OptGroup
        label={
          <span className={styles.selectGroup}>
            {t("folder.folder_setting.default_server_name")}
          </span>
        }
        className={styles.select}
      >
        <Select.Option
          key="0"
          value="0"
          label={t("folder.folder_setting.from_parent")}
          className={styles.select}
        >
          <Flex justify="space-between" gap={16}>
            <span>{t("folder.folder_setting.from_parent")}</span>
            <Tooltip title={t("folder.folder_setting.from_parent_tip")}>
              <span style={{ ...optionsContentDefaultStyle }}>
                {t("folder.folder_setting.from_parent_tip")}
              </span>
            </Tooltip>
          </Flex>
        </Select.Option>
      </Select.OptGroup>
      <Select.OptGroup
        label={
          <span className={styles.selectGroup}>
            {" "}
            {t("folder.folder_setting.set")}
          </span>
        }
        className={styles.select}
      >
        {map(serverList, (serverItem) => (
          <Select.Option
            key={serverItem.server_id}
            value={serverItem.server_id}
            label={serverItem.name}
            className={styles.select}
          >
            <Flex justify="space-between">
              <Tooltip title={serverItem.name}>
                <span
                  style={{
                    ...optionsContentDefaultStyle,
                  }}
                >
                  {serverItem.name}
                </span>
              </Tooltip>
              <Tooltip title={`${serverItem.uri}（${currentEnv?.name}）`}>
                <span
                  style={{
                    maxWidth: "75%",
                    ...optionsContentDefaultStyle,
                  }}
                >
                  {serverItem.uri}（{currentEnv?.name}）
                </span>
              </Tooltip>
            </Flex>
          </Select.Option>
        ))}
      </Select.OptGroup>
    </Select>
  );
};

export default ServerSelect;
