import type { HttpEditorProps } from "@onapi/domain/requests/record";
import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import {
  beginRequest,
  cancelRequest,
} from "@/features/requests/utils/requestExecution";
import { selectRequestIndex } from "@/features/requests/store/useApis";
import clsx from "clsx";
import { requestUrl, editedUrl } from "@onapi/domain";
import styles from "../../RequestWorkspace.module.css";
import styles2 from "./UrlPanel.module.css";
import { memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Dropdown, Flex, MenuProps, Tree } from "@/shared/ui/base";
import Button from "@/shared/ui/Button";
import i18next from "i18next";
import { produce } from "immer";
import { cloneDeep, head, isEqual } from "lodash-es";

import UrlGroup from "@/features/requests/editor/UrlGroup";
import { AppIcon } from "@/shared/ui";

import useApis from "@/features/requests/store/useApis";
import useUserConfig from "@/features/auth/store/useUserConfig";
import type { HttpEditorRecord as GraphQLDetailsData } from "@onapi/domain/requests/record";
import { getCollectionServerId } from "@/features/requests/utils/apis";
import { convertToSaveFolderTree } from "@/shared/utils/common";

import { AnyObject } from "@onapi/domain/types/common";

const items: MenuProps["items"] = [
  {
    label: i18next.t("api.run.send_save"),
    key: "send_and_save",
  },
];

const menuProps = {
  items,
};

const Index = memo((props: HttpEditorProps) => {
  const { t } = useTranslation();
  const { apisData, onApisDataChange } = props;
  const curApiSendingData = useApis((state) => state.currentSendingData);
  const apisActiveData = useApis((store) => store.apisActiveData);
  const apiDetailsData = useApis(selectRequestIndex);
  const apiOriginDetailsList = useApis((store) => store.apiOriginDetailsList);

  const updateCurrentServerId = useApis((store) => store.updateCurrentServerId);
  const currentServerId = useApis((store) => store.currentServerId);

  const isReadonly = useUserConfig((state) => state.isReadonly);
  const [saveLoading, setSaveLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const tempServerId = getCollectionServerId(
      apisActiveData?.id,
      apiOriginDetailsList.reduce((pre: any, cur) => {
        if (cur?.id) {
          pre[cur.id] = cur;
        }
        return pre;
      }, {}),
    );
    updateCurrentServerId(tempServerId);
  }, [apiOriginDetailsList]);

  const isSending = isEqual(curApiSendingData?.status, "sending");

  const urlGroupData = useMemo(
    () => ({
      url: requestUrl(apisData),
    }),
    [apisData],
  );
  const currentData = (): GraphQLDetailsData => {
    const latest = useApis.getState().apisActiveData;
    return latest?.id === apisData.id &&
      (latest.kind === "api" ||
        latest.kind === "graphql" ||
        latest.kind === "sse")
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

  const dropdownRender = () => (
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
    <div className={styles2.container}>
      <UrlGroup
        type="graphql"
        maxLength={10240}
        data={urlGroupData}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        curServerId={currentServerId}
        SetCurServerId={updateCurrentServerId}
        style={{
          paddingRight: "0",
        }}
        urlGroupExtraContent={
          <Button
            type="primary"
            size="large"
            style={{
              width: "max-content",
              borderRadius: "0 4px 4px 0",
              marginLeft: "4px",
            }}
            onClick={() => {
              if (isSending) {
                cancelRequest();
              } else {
                handleSend();
              }
            }}
            className={clsx(styles.button, styles2.button)}
          >
            {isSending ? t("supplement.cancel_send") : t("api.run.send")}
          </Button>
        }
      />
      <Flex style={{ marginLeft: "4px" }} gap={12} className={styles2.flex}>
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
          overlayStyle={{ fontSize: 14 }}
          disabled={isReadonly}
          destroyPopupOnHide
          dropdownRender={dropdownRender}
        >
          {t("api.run.save")}
        </Dropdown.Button>
      </Flex>
    </div>
  );
});

export default Index;
