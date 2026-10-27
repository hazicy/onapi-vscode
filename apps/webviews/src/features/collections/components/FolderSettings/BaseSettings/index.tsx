import styles from "./index.module.css";
import { FC, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Flex, Input, InputRef, TreeSelect } from "@/shared/ui/base";

import { useDebounceEffect } from "ahooks";
import { produce } from "immer";

import useFolders from "@/features/collections/hooks/useFolders";
import useApis from "@/features/requests/store/useApis";
import { FolderDetailsData } from "@onapi/http-model/requests/types/folder";
import { ChangeFuncType } from "@onapi/http-model/types/common";

import ServerSelect from "./ServerSelect";

import { Empty } from "@/shared/ui";

interface Props {
  value: FolderDetailsData;
  onChange: (value: FolderDetailsData) => void;
}

const BaseSettings: FC<Props> = ({ value, onChange }) => {
  const { apisFolders } = useFolders({ currentTargetId: value?.id });
  const apisActiveKey = useApis((state) => state.apisActiveData.id);
  const isNew = useApis(
    (state) =>
      !state.apiOriginDetailsList.some((item) => item.id === value?.id),
  );
  const { t } = useTranslation();
  const inputRef = useRef<InputRef>(null);

  const handleChange: ChangeFuncType<FolderDetailsData> = (key, newValue) => {
    const newApisData = produce(value, (draft) => {
      draft[key] = newValue;
    });

    onChange(newApisData);
  };

  useDebounceEffect(
    () => {
      if (apisActiveKey === value?.id && isNew && !value?.description) {
        inputRef.current!.focus({
          cursor: "end",
        });
      }
    },
    [apisActiveKey],
    { wait: 100 },
  );

  return (
    <div className={styles.container}>
      <div className={styles.folderBaseConfigWrap}>
        <Flex
          justify="space-between"
          align="center"
          className={styles.folderSaveWrap}
        >
          <Input
            ref={inputRef}
            className={styles.folderBaseInput}
            maxLength={255}
            placeholder={t("supplement.folder")}
            value={value?.name}
            onChange={(event) => handleChange("name", event.target.value)}
          />
        </Flex>
        <Flex align="center" className={styles.folderConfigWrap}>
          <Flex className={styles.folderConfigItemWrap} vertical>
            <span className={styles.label}>
              {t("folder.folder_setting.service")}
            </span>
            <ServerSelect
              value={value?.server_id || ""}
              onChange={(value) => handleChange("server_id", value)}
            />
          </Flex>
          <Flex className={styles.folderConfigItemWrap} vertical>
            <span className={styles.label}>{t("supplement.folder")}</span>
            <TreeSelect
              showSearch
              treeDefaultExpandAll
              placeholder={t("supplement.select_folder_tip")}
              style={{ width: "100%" }}
              filterTreeNode={(input, treeNode) => {
                return treeNode.name.includes(input);
              }}
              fieldNames={{
                label: "name",
                value: "id",
                children: "children",
              }}
              value={value?.parentId}
              dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
              treeData={apisFolders}
              onChange={(value) => handleChange("parentId", value)}
              notFoundContent={<Empty description="No Data" />}
              className={styles.select}
            />
          </Flex>
        </Flex>
      </div>
    </div>
  );
};

export default BaseSettings;
