import RequestToolbar from "@/features/requests/components/RequestToolbar";
import RequestAction from "@/features/requests/components/RequestAction";
import type { HttpEditorProps } from "@onapi/domain/requests/record";
import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import {
  beginRequest,
  cancelRequest,
} from "@/features/requests/execution/request-actions";
import { selectRequestIndex } from "@/features/requests/store/useRequestWorkspaceStore";
import { requestUrl, editedUrl } from "@onapi/domain";
import styles from "../../RequestWorkspace.module.css";
import styles2 from "./UrlPanel.module.css";
import { memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Dropdown, Flex, Tree } from "@/shared/ui/base";
import { produce } from "immer";
import { cloneDeep, head, isEqual } from "lodash-es";

import UrlGroup from "@/features/requests/editor/UrlGroup";
import { AppIcon } from "@/shared/ui";

import useRequestWorkspaceStore from "@/features/requests/store/useRequestWorkspaceStore";
import useUserConfig from "@/features/auth/store/useUserConfig";
import type { HttpEditorRecord } from "@onapi/domain/requests/record";
import { getCollectionServerId } from "@onapi/domain/request-utils";
import { convertToSaveFolderTree } from "@/shared/utils/common";

import { AnyObject } from "@onapi/domain/types/common";

const Index = memo((props: HttpEditorProps) => {
  const { t } = useTranslation();
  const { apisData, onApisDataChange } = props;
  const httpExecution = useRequestWorkspaceStore(
    (state) => state.httpExecution,
  );
  const activeRequest = useRequestWorkspaceStore(
    (store) => store.activeRequest,
  );
  const apiDetailsData = useRequestWorkspaceStore(selectRequestIndex);
  const savedRequests = useRequestWorkspaceStore(
    (store) => store.savedRequests,
  );

  const setCurrentServerId = useRequestWorkspaceStore(
    (store) => store.setCurrentServerId,
  );
  const currentServerId = useRequestWorkspaceStore(
    (store) => store.currentServerId,
  );

  const isReadonly = useUserConfig((state) => state.isReadonly);
  const [saveLoading, setSaveLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const tempServerId = getCollectionServerId(
      activeRequest?.id,
      savedRequests.reduce((pre: any, cur) => {
        if (cur?.id) {
          pre[cur.id] = cur;
        }
        return pre;
      }, {}),
    );
    setCurrentServerId(tempServerId);
  }, [savedRequests]);

  const isSending = isEqual(httpExecution?.session?.status, "running");

  const urlGroupData = useMemo(
    () => ({
      url: requestUrl(apisData),
    }),
    [apisData],
  );
  const currentData = (): HttpEditorRecord => {
    const latest = useRequestWorkspaceStore.getState().activeRequest;
    return latest?.id === apisData.id &&
      (latest.kind === "api" || latest.kind === "graphql")
      ? latest
      : apisData;
  };
  const handleChange = (key: string, value: string) => {
    const result = produce(currentData(), (draft: AnyObject) => {
      if (key === "url") {
        draft.request.url = editedUrl(value, draft.request.url);
      } else {
        draft[key] = value || "";
      }
    });
    onApisDataChange(result);
  };

  const handleSend = () => {
    const executionId = beginRequest();
    if (!executionId) {
      return;
    }
    sendRequestPanelMessage({
      action: "sendApi",
      executionId,
      data: { ...currentData(), kind: "graphql" },
      option: {
        server_id: currentServerId,
      },
    });
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    isEnvVisible?: boolean,
  ) => {
    if (isEnvVisible) {
      return;
    }

    // Disable Enter key send when using modifier shortcuts
    const ctrlDown = event.metaKey || event.ctrlKey;
    if (event?.keyCode === 13 && !ctrlDown) {
      setTimeout(() => {
        handleSend();
      }, 100);
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      const result = cloneDeep(apisData);
      sendRequestPanelMessage({
        action: "saveApiData",
        data: result,
      });
    } catch (err) {
    } finally {
      setSaveLoading(false);
    }
  };

  const popupRender = () => (
    <div className={styles.saveDropDown}>
      <Tree
        height={250}
        autoExpandParent
        defaultExpandAll
        onSelect={(keys: React.Key[]) => {
          const parentId = head(keys);
          const result = cloneDeep(apisData);
          sendRequestPanelMessage({
            action: "saveApiData",
            data: { ...result, parentId: parentId as string },
          });
          setOpen(false);
        }}
        fieldNames={{ title: "label" }}
        treeData={convertToSaveFolderTree(apiDetailsData)}
        titleRender={(nodeData) => {
          return (
            <div className={styles.dropdownTreeTitle}>{nodeData.label}</div>
          );
        }}
      />
    </div>
  );
  return (
    <RequestToolbar className={styles2.container}>
      <UrlGroup
        type="graphql"
        maxLength={10240}
        data={urlGroupData}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        curServerId={currentServerId}
        SetCurServerId={setCurrentServerId}
        style={{
          paddingRight: "0",
        }}
        urlGroupExtraContent={
          <>
            <Flex
              style={{ marginLeft: "4px" }}
              gap={12}
              className={styles2.flex}
            >
              <Dropdown.Button
                placement="bottomRight"
                type="default"
                size="small"
                trigger={["click"]}
                icon={<AppIcon icon="chevron-down" />}
                loading={saveLoading}
                open={open}
                onOpenChange={(open) => setOpen(open)}
                onClick={handleSave}
                popupStyle={{ fontSize: "inherit" }}
                disabled={isReadonly}
                keepMounted={false}
                popupRender={popupRender}
              >
                {t("api.run.save")}
              </Dropdown.Button>
            </Flex>
            <RequestAction
              label={t(isSending ? "supplement.cancel_send" : "api.run.send")}
              stopping={isSending}
              onClick={() => (isSending ? cancelRequest() : handleSend())}
            />
          </>
        }
      />
    </RequestToolbar>
  );
});

export default Index;
