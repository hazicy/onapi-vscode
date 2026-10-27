import { selectRequestIndex } from "@/features/requests/store/useApis";
import styles from "./index.module.css";
import { FC, lazy, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Dropdown, Flex, Tree } from "@/shared/ui/base";

import { useMemoizedFn, useSafeState } from "ahooks";
import { cloneDeep, find, head, isArray } from "lodash";

import { SuspenseContent } from "@/shared/components";

import ResizablePanels from "@/shared/components/ResizablePanels";
import UrlGroup from "@/features/requests/components/UrlGroup";
import Button from "@/shared/ui/Button";
import AppIcon from "@/shared/ui/AppIcon";
import { APIS_TARGET_TYPE_ENUM } from "@onapi/http-model/requests/constants/index";
import useApis from "@/features/requests/store/useApis";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import useUserConfig from "@/features/auth/store/useUserConfig";
import useApisWebSocket from "@/features/requests/store/useApis/websocket";
import {
  SocketIoComponentType,
  SocketIoDetailsData,
} from "@onapi/http-model/requests/types/socketio";
import { AnyObject, DirectionType } from "@onapi/http-model/types/common";
import { genQueryByUrl } from "@/features/requests/utils/apis";
import { convertToSaveFolderTree, importDelay } from "@/shared/utils/common";

import useWebSocket from "../useWebSocket";

import ToolBar from "../../api/Debug/ToolBar";
import { ApiDetailsData } from "@onapi/http-model/requests/types/api";
import { produce } from "immer";

const Request = lazy(() => importDelay(import("./Request")));
const Response = lazy(() => importDelay(import("./Response")));
const panelProps = {
  defaultSize: 50,
  minSize: 5,
  collapsible: true,
  collapsedSize: 5,
};
const SocketIoDebug: FC<SocketIoComponentType> = ({
  apisData,
  onApisDataChange,
}) => {
  const { t } = useTranslation();
  const { connectWebSocket } = useWebSocket();
  const websocketConnectionPool = useApisWebSocket(
    (state) => state.websocketConnectionPool,
  );
  const [curServerId, SetCurServerId] = useState("");
  const [apiScreenDirection, setApiScreenDirection] =
    useSafeState<DirectionType>("vertical");
  const apiDetailsData = useApis(selectRequestIndex);
  const isReadonly = useUserConfig((state) => state.isReadonly);

  const [saveLoading, setSaveLoading] = useSafeState(false);
  const [open, setOpen] = useSafeState(false);

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

  const handleRequest = useMemoizedFn((data: SocketIoDetailsData) => {
    onApisDataChange(data);
  });

  const status = useMemo(() => {
    return websocketConnectionPool[apisData?.id]?.status;
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
        titleRender={(nodeData) => {
          return (
            <div className={styles.dropdownTreeTitle}>{nodeData.label}</div>
          );
        }}
      />
    </div>
  );
  const handleDirectionChange = (direction: DirectionType) => {
    setApiScreenDirection(direction);
  };
  return (
    <>
      <ToolBar
        showLayoutControl
        apisData={apisData as unknown as ApiDetailsData}
        onApisDataChange={(val) => {
          onApisDataChange(val as unknown as SocketIoDetailsData);
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
                curServerId={curServerId}
                SetCurServerId={SetCurServerId}
                maxLength={10240}
                readOnly={status === "connect"}
                data={{
                  url: apisData?.url,
                }}
                type={APIS_TARGET_TYPE_ENUM.SOCKETIO}
                onChange={handleUrlPanel}
                style={{ padding: "3px", paddingRight: "0" }}
                urlGroupExtraContent={
                  <Button
                    type="primary"
                    size="large"
                    style={{
                      marginLeft: 4,
                      width: "max-content",
                      borderRadius: "0 4px 4px 0",
                    }}
                    onClick={() => {
                      connectWebSocket(apisData, status, curServerId);
                    }}
                    className={styles.button}
                  >
                    {status === "connect"
                      ? t("supplement.disconnect")
                      : status === "connecting"
                        ? t("supplement.connecting")
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
          showDirectionBtn
          panelGroupProps={{
            autoSaveId: "socketio_debug_container_resize_save_id",
            direction: apiScreenDirection,
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
                  readOnly={status === "connect"}
                  value={apisData}
                  onChange={handleRequest}
                />
              </div>
            </SuspenseContent>
          }
          rightPanel={
            <SuspenseContent>
              <div style={{ padding: "0 16px", height: "100%" }}>
                <Response
                  apiScreenDirection={apiScreenDirection}
                  value={apisData}
                  onChange={handleRequest}
                />
              </div>
            </SuspenseContent>
          }
          onDirectionChange={handleDirectionChange}
        />
      </div>
    </>
  );
};

export default SocketIoDebug;
