import styles from "./ShareList.module.css";
import { useCallback } from "react";
import { AppIcon } from "@/shared/ui";
import { Flex, Input, MenuProps, message, Typography } from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import useDocsData from "./hooks/useDocsData";
import useShare from "@/features/sharing/store/useShare";
import useApis from "@/features/requests/store/useApis";
import { last } from "lodash-es";
import { ApiDetailsData } from "@onapi/http-model/requests/types/api";
import { useTranslation } from "react-i18next";
import { openUrl } from "@/shared/utils/open";
import {
  copyApiDocsUrlToClipboard,
  getApiDocsUrlById,
} from "@/features/sharing/utils/share";
import SharePanel from "./components/SharePanel";

const SharePage = () => {
  const { t } = useTranslation();

  const [searchValue, setSearchValue] = useSafeState("");

  const shareData = useShare((state) => state.shareData);
  const apiOriginDetailsList = useApis((store) => store.apiOriginDetailsList);
  const { filteredShareList } = useDocsData({
    searchIncludesField: ["name", "url"],
    dataSource: apiOriginDetailsList,
    treeDataFilterParams: {
      value: searchValue,
    },
    shareData,
  });

  const dropdownContextMenu: MenuProps["items"] = [
    {
      label: (
        <Flex gap={8} align="center" className={styles.flex}>
          <AppIcon icon="copy" />
          {t("docs.document.copy_link")}
        </Flex>
      ),
      key: "copy_link",
    },
    {
      label: (
        <Flex gap={8} align="center" className={styles.flex}>
          <AppIcon icon="external-link" />
          {t("docs.document.open_link")}
        </Flex>
      ),
      key: "open_link",
    },
    {
      label: (
        <Flex gap={8} align="center" className={styles.flex}>
          <AppIcon icon="trash-2" />
          Delete
        </Flex>
      ),
      key: "delete",
    },
  ];

  const handleMoreOperateClick = async (
    nodeItem: ApiDetailsData,
    keyPath: string[],
  ) => {
    const actionType = last(keyPath) || "";
    switch (actionType) {
      case "delete":
        window?.vscode.postMessage({
          action: "deleteShare",
          data: { id: nodeItem.id },
        });
        break;
      case "export":
        window?.vscode.postMessage({
          action: "exportOpenApiById",
          data: { id: nodeItem.id },
        });
        break;
      case "open_link":
        openUrl(getApiDocsUrlById(nodeItem.id));
        break;
      case "copy_link":
        copyApiDocsUrlToClipboard(nodeItem.id, () =>
          message.success(t("supplement.clipboard_success")),
        );
        break;
      default:
        break;
    }
  };

  const nodeItemDropdownContextMenu = useCallback(
    (nodeItem: ApiDetailsData): MenuProps => {
      return {
        items: dropdownContextMenu,
        onClick: ({ keyPath }) => handleMoreOperateClick(nodeItem, keyPath),
      };
    },
    [],
  );

  return (
    <div className={styles.container}>
      <Flex justify="space-between" className={styles.flex}>
        <Typography.Text
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--font-title-color)",
          }}
        >
          Share List
        </Typography.Text>
        <Input
          prefix={<AppIcon icon="search" />}
          placeholder={"Search by keywords"}
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          style={{ width: "240px" }}
        />
      </Flex>
      <SharePanel
        searchValue={searchValue}
        shareList={filteredShareList}
        activeTab={""}
        menuType={"share"}
      />
    </div>
  );
};

export default SharePage;
