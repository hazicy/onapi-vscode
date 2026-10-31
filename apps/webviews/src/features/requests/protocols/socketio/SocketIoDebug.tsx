import styles from "./SocketIoDebug.module.css";
import { FC, lazy, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Flex } from "@/shared/ui/base";

import { useMemoizedFn } from "ahooks";
import { find, isArray } from "lodash-es";

import { SuspenseContent } from "@/shared/components";

import ResizablePanels from "@/shared/components/ResizablePanels/ResizablePanels";
import UrlGroup from "@/features/requests/editor/UrlGroup";
import Button from "@/shared/ui/Button";
import { APIS_TARGET_TYPE_ENUM } from "@onapi/domain/requests/constants/index";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import useApisWebSocket from "@/features/requests/store/useApis/websocket";
import {
  SocketIoComponentType,
  SocketIoDetailsData,
} from "@onapi/domain/requests/types/socketio";
import { AnyObject } from "@onapi/domain/types/common";
import { genQueryByUrl } from "@/features/requests/utils/apis";
import { importDelay } from "@/shared/utils/common";

import useWebSocket from "./useWebSocket";

import ToolBar from "../http/ToolBar";
import { ApiDetailsData } from "@onapi/domain/requests/types/api";
import { produce } from "immer";

const Request = lazy(() => importDelay(import("./Request/Request")));
const Response = lazy(() => importDelay(import("./Response/Response")));
const panelProps = {
  defaultSize: 44,
  minSize: 25,
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

  return (
    <>
      <ToolBar
        apisData={apisData as unknown as ApiDetailsData}
        onApisDataChange={(val) => {
          onApisDataChange(val as unknown as SocketIoDetailsData);
        }}
      />
      <div className={styles.container}>
        <div className={styles.urlPanel}>
          <Flex
            flex={1}
            justify="space-between"
            align="center"
            className={styles.connectionRow}
          >
            <div className={styles.urlGroup}>
              <UrlGroup
                curServerId={curServerId}
                SetCurServerId={SetCurServerId}
                maxLength={10240}
                readOnly={status === "connect" || status === "connecting"}
                data={{
                  url: apisData?.url,
                }}
                type={APIS_TARGET_TYPE_ENUM.SOCKETIO}
                onChange={handleUrlPanel}
                style={{ padding: "3px", paddingRight: "0" }}
                urlGroupExtraContent={
                  <Button
                    type="primary"
                    disabled={
                      !apisData.url?.trim() &&
                      status !== "connect" &&
                      status !== "connecting"
                    }
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
                        ? t("ws.request.cancel")
                        : t("supplement.connect")}
                  </Button>
                }
              />
            </div>
          </Flex>
        </div>
        <ResizablePanels
          panelGroupProps={{
            autoSaveId: "socketio_debug_container_resize_save_id",
            direction: "vertical",
          }}
          leftPanelProps={{
            ...panelProps,
            collapseTitle: t("supplement.request_panel"),
          }}
          rightPanelProps={{
            ...panelProps,
            defaultSize: 56,
            collapseTitle: t("supplement.response_panel"),
          }}
          leftPanel={
            <SuspenseContent>
              <div className={styles.requestPanel}>
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
              <div className={styles.responsePanel}>
                <Response value={apisData} onChange={handleRequest} />
              </div>
            </SuspenseContent>
          }
        />
      </div>
    </>
  );
};

export default SocketIoDebug;
