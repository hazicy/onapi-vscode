import styles from "./WebSocketDebug.module.css";
import { Icon } from "@iconify/react";
import plugZap from "@iconify-icons/lucide/plug-zap";
import unplug from "@iconify-icons/lucide/unplug";
import { FC, lazy, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Flex } from "@/shared/ui/base";

import { useMemoizedFn, useSafeState } from "ahooks";
import { find, isArray } from "lodash-es";

import { SuspenseContent } from "@/shared/components";

import ResizablePanels from "@/shared/components/ResizablePanels/ResizablePanels";
import UrlGroup from "@/features/requests/editor/UrlGroup";
import Button from "@/shared/ui/Button";
import { APIS_TARGET_TYPE_ENUM } from "@onapi/domain/requests/constants/index";
import ToolBar from "../http/ToolBar";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import useApisWebSocket from "@/features/requests/store/useApis/websocket";
import {
  WebSocketComponentType,
  WebSocketDetailsData,
} from "@onapi/domain/requests/types/websocket";
import { importDelay } from "@/shared/utils/common";

import useWebSocket from "./useWebSocket";

import { ApiDetailsData } from "@onapi/domain/requests/types/api";
import { produce } from "immer";
import { AnyObject } from "@onapi/domain/types/common";
import { genQueryByUrl } from "@/features/requests/utils/apis";

const Request = lazy(() => importDelay(import("./Request/Request")));
const Response = lazy(() => importDelay(import("./Response/Response")));
const panelProps = {
  defaultSize: 44,
  minSize: 25,
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

  return (
    <>
      <ToolBar
        apisData={apisData as unknown as ApiDetailsData}
        onApisDataChange={(val) => {
          onApisDataChange(val as unknown as WebSocketDetailsData);
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

export default WsDebug;
