import tabStyles from "@/shared/components/LineTabs/LineTabs.module.css";
import styles from "../SocketIoDebug.module.css";
import React, { lazy, memo } from "react";
import { useTranslation } from "react-i18next";

import { Flex } from "@/shared/ui/base";

import { useMemoizedFn } from "ahooks";
import { map } from "lodash-es";

import { LineTabs, SuspenseContent } from "@/shared/components";

import useApisWebSocket from "@/features/requests/store/useApis/websocket";

const Realtime = lazy(() => import("./Realtime/Realtime"));

const RealRequest = lazy(() => import("./RealRequest/RealRequest"));

const Response: React.FC = memo((props: any) => {
  const websocketConnectionPool = useApisWebSocket(
    (state) => state.websocketConnectionPool,
  );
  const { value, onChange } = props || {};
  const { t } = useTranslation();

  const originItems = [
    {
      key: "realtime",
      label: t("ws.layout.messages"),
      children: <Realtime id={value?.id} onChange={onChange} />,
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
        tabListClassName={tabStyles.selectionList}
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
});

export default Response;
