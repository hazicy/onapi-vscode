import styles from "../index.module.css";
import { useTranslation } from "react-i18next";

import { Flex, message } from "@/shared/ui/base";

import { useDebounce, useSafeState } from "ahooks";

import cn from "classnames";

import { Button, AppIcon, Tooltip } from "@/shared/ui";
import { Modal } from "@/shared/ui/Modal";
import { openUrl } from "@/shared/utils/open";

import { PanelProps } from "../types";
import TabsPanel from "./Tabs";
import {
  copyApiDocsUrlToClipboard,
  getApiDocsUrlById,
} from "@/features/sharing/utils/share";

const SharePanel = (props: PanelProps) => {
  const { t } = useTranslation();
  const { searchValue, shareList } = props || {};
  const debouncedValue = useDebounce(searchValue, { wait: 250 });
  const [modal, contextHolder] = Modal.useModal();

  const [checkedList, setCheckedList] = useSafeState<any[]>([]);

  const tabExtraContent = (
    <Flex
      className={cn(
        styles.shareListDeleteBtn,
        {
          [styles.show]: checkedList.length > 0,
        },
        styles.flex,
      )}
    >
      <Button
        onClick={() => {
          window?.vscode.postMessage({
            action: "batchDeleteShare",
            data: checkedList,
          });
          setCheckedList([]);
        }}
        type="primary"
        className={styles.button}
      >
        {"Delete"}
      </Button>
    </Flex>
  );
  const listExtraContent = (_tar: string, item: any) => (
    <>
      <Tooltip title={t("docs.document.copy_link")}>
        <Button
          onClick={() =>
            copyApiDocsUrlToClipboard(item.id, () =>
              message.success(t("supplement.clipboard_success")),
            )
          }
          type="text"
          icon={<AppIcon icon="copy" />}
          className={styles.button}
        ></Button>
      </Tooltip>
      <Tooltip title={t("docs.document.open_link")}>
        <Button
          onClick={() => openUrl(getApiDocsUrlById(item.id))}
          type="text"
          icon={<AppIcon icon="terminal" />}
          className={styles.button}
        ></Button>
      </Tooltip>

      <Tooltip title={t("docs.document.delete")}>
        <Button
          onClick={() => {
            window?.vscode.postMessage({
              action: "deleteShare",
              data: { id: item.id },
            });
          }}
          type="link"
          className={styles.button}
          icon={<AppIcon icon="trash-2" />}
        ></Button>
      </Tooltip>
    </>
  );
  return (
    <>
      <TabsPanel
        {...props}
        fieldKey="issue_id"
        setCheckedList={setCheckedList}
        checkedList={checkedList}
        lists={shareList}
        searchValue={debouncedValue}
        tabExtraContent={tabExtraContent}
        listExtraContent={listExtraContent}
      />
      {contextHolder}
    </>
  );
};

export default SharePanel;
