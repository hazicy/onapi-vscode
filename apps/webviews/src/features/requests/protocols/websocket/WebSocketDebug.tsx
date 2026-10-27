import { selectRequestIndex } from "@/features/requests/store/useApis";
import styles from "./WebSocketDebug.module.css";
import { Icon } from "@iconify/react";
import plugZap from "@iconify-icons/lucide/plug-zap";
import unplug from "@iconify-icons/lucide/unplug";
import { FC, lazy, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Dropdown, Flex, Tree } from "@/shared/ui/base";

import { useMemoizedFn, useSafeState } from "ahooks";
import { cloneDeep, find, head, isArray } from "lodash";

import { SuspenseContent } from "@/shared/components";

import ResizablePanels from "@/shared/components/ResizablePanels/ResizablePanels";
import UrlGroup from "@/features/requests/editor/UrlGroup";
import Button from "@/shared/ui/Button";
import AppIcon from "@/shared/ui/AppIcon";
import { APIS_TARGET_TYPE_ENUM } from "@onapi/http-model/requests/constants/index";
import ToolBar from "../http/ToolBar";
import useApis from "@/features/requests/store/useApis";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import useUserConfig from "@/features/auth/store/useUserConfig";
import useApisWebSocket from "@/features/requests/store/useApis/websocket";
import {
  WebSocketComponentType,
  WebSocketDetailsData,
} from "@onapi/http-model/requests/types/websocket";
import { convertToSaveFolderTree, importDelay } from "@/shared/utils/common";

import useWebSocket from "./useWebSocket";

import { ApiDetailsData } from "@onapi/http-model/requests/types/api";
import { produce } from "immer";
import { AnyObject } from "@onapi/http-model/types/common";
import { genQueryByUrl } from "@/features/requests/utils/apis";

const Request = lazy(() => importDelay(import("./Request/Request")));
const Response = lazy(() => importDelay(import("./Response/Response")));
const panelProps = {
  defaultSize: 50,
  minSize: 5,
  collapsible: true,
  collapsedSize: 5,
};
const WsDebug: FC<WebSocketComponentType> = ({
  apisData,
  onApisDataChange,
}) => {
  const { t } = useTranslation();
  const { connectWebSocket } = useWebSocket();
  const websocketConnectionPool = useApisWebSocket(
    (state) => state.websocketConnectionPool,
  );

  const apiDetailsData = useApis(selectRequestIndex);
  const isReadonly = useUserConfig((state) => state.isReadonly);

  const [saveLoading, setSaveLoading] = useSafeState(false);
  const [open, setOpen] = useSafeState(false);
  const [curServerId, SetCurServerId] = useSafeState("");
  const envList = useProjectConfig((state) => state.envList);
  const envDetailKeys = useProjectConfig((state) => state.envDetailKeys);

  useEffect(() => {
    const currentEnv = find(envList, (it) => it?.env_id === envDetailKeys);
    if (isArray(currentEnv?.server_list) && curServerId === "") {
      const defaultServerId =
        currentEnv.server_list.find((i: any) => i?.is_default === 1)
          ?.server_id || "";
      SetCurServerId(defaultServerId);
    }
  }, [envList, envDetailKeys, curServerId]);

  const onSave = async () => {
    setSaveLoading(true);
    try {
      window?.vscode.postMessage({
        action: "saveApiData",
        data: apisData,
      });
    } catch (err) {
    } finally {
      setSaveLoading(false);
    }
  };

  const handleUrlPanel = useMemoizedFn((key: string, value: string) => {
    onApisDataChange(
      produce(apisData, (draft: AnyObject) => {
        draft[key] = value;
        if (key === "url") {
          if (value) {
            if (isArray(draft?.request?.query?.parameter)) {
              draft.request.query.parameter = genQueryByUrl(
                `${value}`,
                draft?.request?.query?.parameter || [],
              );
            }
          } else {
            if (draft.request.query?.parameter) {
              draft.request.query.parameter = [];
            }
          }
        }
      }),
    );
  });

  const handleRequest = useMemoizedFn((data: WebSocketDetailsData) => {
    onApisDataChange(data);
  });

  const status = useMemo(() => {
    return websocketConnectionPool?.[apisData?.id]?.status;
  }, [websocketConnectionPool, apisData]);

  const dropdownRender = () => (
    <div className={styles.saveDropDown}>
      <Tree
        height={250}
        blockNode
        autoExpandParent
        defaultExpandAll
        onSelect={(keys: React.Key[]) => {
          const parentId = head(keys);
          const result = cloneDeep(apisData);

          window?.vscode.postMessage({
            action: "saveApiData",
            data: { ...result, parentId: parentId as string },
          });
          setOpen(false);
        }}
        fieldNames={{ title: "label" }}
        treeData={convertToSaveFolderTree(apiDetailsData)}
        titleRender={(nodeData: any) => {
          return (
            <div className={styles.dropdownTreeTitle}>{nodeData.label}</div>
          );
        }}
      />
    </div>
  );

  return (
    <>
      <ToolBar
        apisData={apisData as unknown as ApiDetailsData}
        onApisDataChange={(val) => {
          onApisDataChange(val as unknown as WebSocketDetailsData);
        }}
      />
      <div className={styles.container}>
        <div className={styles.urlPanel} style={{ padding: "0 16px" }}>
          <Flex
            flex={1}
            justify="space-between"
            align="center"
            className={styles.flex}
          >
            <div className={styles.urlGroup}>
              <UrlGroup
                maxLength={10240}
                placeholder={t("supplement.socket_url_placeholder")}
                readOnly={status === "connect" || status === "connecting"}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.nativeEvent.isComposing &&
                    status !== "connecting" &&
                    status !== "connect" &&
                    apisData.url?.trim()
                  ) {
                    event.preventDefault();
                    connectWebSocket(apisData, status, curServerId);
                  }
                }}
                data={{
                  url: apisData?.url,
                }}
                type={APIS_TARGET_TYPE_ENUM.WEBSOCKET}
                onChange={handleUrlPanel}
                curServerId={curServerId}
                SetCurServerId={SetCurServerId}
                style={{ padding: "3px", paddingRight: "0" }}
                urlGroupExtraContent={
                  <Button
                    type="primary"
                    size="large"
                    disabled={
                      !apisData.url?.trim() &&
                      status !== "connect" &&
                      status !== "connecting"
                    }
                    icon={
                      <Icon icon={status === "connect" ? unplug : plugZap} />
                    }
                    style={{ marginLeft: 4, borderRadius: "0 4px 4px 0" }}
                    onClick={() => {
                      connectWebSocket(apisData, status, curServerId);
                    }}
                    className={styles.button}
                  >
                    {status === "connect"
                      ? t("supplement.disconnect")
                      : status === "connecting"
                        ? t("ws.request.cancel")
                        : t("supplement.connect")}
                  </Button>
                }
              />
            </div>
            <Flex
              style={{ marginLeft: "4px" }}
              gap={12}
              className={styles.flex}
            >
              <Dropdown.Button
                getPopupContainer={(triggerNode) =>
                  triggerNode.parentNode as HTMLElement
                }
                placement="bottomRight"
                open={open}
                onOpenChange={(open) => setOpen(open)}
                type="default"
                size="small"
                trigger={["click"]}
                icon={<AppIcon icon="chevron-down" />}
                loading={saveLoading}
                onClick={onSave}
                overlayStyle={{ fontSize: 14 }}
                disabled={isReadonly}
                destroyPopupOnHide
                dropdownRender={dropdownRender}
              >
                {t("supplement.save")}
              </Dropdown.Button>
            </Flex>
          </Flex>
        </div>
        <ResizablePanels
          panelGroupProps={{
            direction: "vertical",
          }}
          leftPanelProps={{
            ...panelProps,
            collapseTitle: t("supplement.request_panel"),
          }}
          rightPanelProps={{
            ...panelProps,
            collapseTitle: t("supplement.response_panel"),
          }}
          leftPanel={
            <SuspenseContent>
              <div style={{ padding: "0 16px 12px 16px", height: "100%" }}>
                <Request
                  readOnly={status === "connect" || status === "connecting"}
                  value={apisData}
                  onChange={handleRequest}
                />
              </div>
            </SuspenseContent>
          }
          rightPanel={
            <SuspenseContent>
              <div style={{ padding: "0 16px", height: "100%" }}>
                <Response value={apisData} onChange={handleRequest} />
              </div>
            </SuspenseContent>
          }
        />
      </div>
    </>
  );
};

export default WsDebug;
