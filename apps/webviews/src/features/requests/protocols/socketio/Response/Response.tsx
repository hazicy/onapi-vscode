import styles from "../SocketIoDebug.module.css";
import React, { lazy, memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Flex } from "@/shared/ui/base";

import { useMemoizedFn } from "ahooks";
import { isEmpty, isEqual, map, size } from "lodash-es";

import { LineTabs, SuspenseContent } from "@/shared/components";

import { Empty } from "@/features/requests/response/Response/components";
import { Button, AppIcon } from "@/shared/ui";
import useApisWebSocket from "@/features/requests/store/useApis/websocket";

const Realtime = lazy(() => import("./Realtime/Realtime"));

const RealRequest = lazy(() => import("./RealRequest/RealRequest"));

const Response: React.FC = memo((props: any) => {
  const websocketConnectionPool = useApisWebSocket(
    (state) => state.websocketConnectionPool,
  );
  const { value, onChange, apiScreenDirection } = props || {};
  const { t } = useTranslation();

  const originItems = [
    {
      key: "realtime",
      label: t("api.run.response_tab"),
      children: (
        <Realtime
          apiScreenDirection={apiScreenDirection}
          id={value?.id}
          onChange={onChange}
        />
      ),
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
  const isNotEmpty = useMemo(() => {
    return (
      size(websocketConnectionPool[value?.id]?.socketRes) > 0 ||
      !isEmpty(websocketConnectionPool[value?.id]?.responseData)
    );
  }, [value?.id, websocketConnectionPool]);
  return (
    <div className={styles.lineBar}>
      {!isNotEmpty && <Empty maskMode />}
      <LineTabs
        items={tabsItems()}
        tabBarExtraContent={
          <Flex align="center" gap={12} className={styles.flex}>
            {isEqual(websocketConnectionPool[value?.id]?.status, "connect") && (
              <Button
                icon={<AppIcon icon="link" />}
                style={{ color: "#26cea4", cursor: "default" }}
                type="text"
                mode="success"
                size="small"
                className={styles.button}
              >
                {t("ws.response.connect_success")}
              </Button>
            )}
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
