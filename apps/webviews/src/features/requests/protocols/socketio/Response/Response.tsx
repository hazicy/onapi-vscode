import styles from "../SocketIoDebug.module.css";
import React, { lazy, memo } from "react";
import { useTranslation } from "react-i18next";


import { useMemoizedFn } from "ahooks";
import { map } from "lodash-es";

import { SuspenseContent } from "@/shared/components";
import RequestTabs from "@/features/requests/components/RequestTabs";

import useSocketConnectionsStore from "@/features/requests/store/useSocketConnectionsStore";

const Realtime = lazy(() => import("./Realtime/Realtime"));

const RealRequest = lazy(() => import("./RealRequest/RealRequest"));

const Response: React.FC = memo((props: any) => {
  const websocketConnectionPool = useSocketConnectionsStore(
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
  return (
    <div className={styles.lineBar}>
      <RequestTabs
        label={t("request_panel.response_tabs")}
        items={tabsItems()}

        panelsClassName={styles.tabsContent}
        className={styles.tabs}
      />
    </div>
  );
});

export default Response;
