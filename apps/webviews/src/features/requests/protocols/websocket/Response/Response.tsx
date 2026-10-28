import styles from "../WebSocketDebug.module.css";
import React, { lazy } from "react";
import { useTranslation } from "react-i18next";

import { Flex } from "@/shared/ui/base";

import { useMemoizedFn } from "ahooks";
import { map } from "lodash-es";

import { LineTabs, SuspenseContent } from "@/shared/components";

import useApisWebSocket from "@/features/requests/store/useApis/websocket";

const Realtime = lazy(() => import("./Realtime/Realtime"));

const ResponseHeader = lazy(
  () =>
    import("@/features/requests/response/Response/components/ResponseHeader"),
);
const Cookie = lazy(
  () => import("@/features/requests/response/Response/components/Cookie"),
);
const RealRequest = lazy(() => import("./RealRequest/RealRequest"));

const Response: React.FC = (props: any) => {
  const websocketConnectionPool = useApisWebSocket(
    (state) => state.websocketConnectionPool,
  );
  const { value, onChange } = props || {};
  const { t } = useTranslation();

  const originItems = [
    {
      key: "realtime",
      label: t("api.run.response_tab"),
      children: <Realtime value={value} onChange={onChange} />,
    },
    {
      key: "responseHeader",
      label: t("api.run.response_header"),
      children: (
        <div style={{ marginTop: 12 }}>
          <ResponseHeader
            value={
              websocketConnectionPool[value?.id]?.responseData?.response
                ?.headers || {}
            }
          />
        </div>
      ),
      countParams: {
        dataSource:
          websocketConnectionPool[value?.id]?.responseData?.response?.headers ||
          [],
      },
    },
    {
      key: "cookie",
      label: "Cookie",
      children: (
        <div style={{ marginTop: 12 }}>
          <Cookie
            value={
              websocketConnectionPool[value?.id]?.responseData?.response
                ?.cookies || []
            }
          />
        </div>
      ),
      countParams: {
        dataSource:
          websocketConnectionPool[value?.id]?.responseData?.response?.cookies ||
          [],
      },
    },
    {
      key: "realRequest",
      label: t("api.run.real_request"),
      children: (
        <div style={{ marginTop: 12 }}>
          <RealRequest
            sendingData={websocketConnectionPool[value?.id]?.responseData}
          />
        </div>
      ),
    },
  ];
  const tabsItems = useMemoizedFn(() => {
    const _originItems = map(originItems, (item) => ({
      ...item,
      children: (
        <SuspenseContent key={item.key}>{item.children}</SuspenseContent>
      ) as React.ReactNode,
    }));

    return _originItems;
  });
  const status = websocketConnectionPool[value?.id]?.status;
  const connectionLabel =
    status === "connect"
      ? t("ws.response.connected")
      : status === "connecting"
        ? t("ws.response.connecting")
        : t("ws.response.disconnected");
  return (
    <div className={styles.lineBar}>
      <LineTabs
        items={tabsItems()}
        tabBarExtraContent={
          <Flex align="center" gap={12} className={styles.flex}>
            <span
              className={styles.connectionStatus}
              data-status={status || "disconnect"}
              role="status"
            >
              <span className={styles.statusDot} aria-hidden="true" />
              {connectionLabel}
            </span>
          </Flex>
        }
        navClassName={styles.tabsNav}
        panelsClassName={styles.tabsContent}
        className={styles.tabs}
      />
    </div>
  );
};

export default Response;
