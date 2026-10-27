import type { HttpExecutionState } from "@/features/requests/execution/http-state";
import { sdkResponseView } from "@/features/requests/utils/executionView";
import classNames from "classnames";
import { responseText } from "@onapi/http-model";
import styles from "./Response.module.css";
import { FC, lazy, memo, Suspense, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { TabPaneProps, TabsProps } from "@/shared/ui/base";

import { useMemoizedFn, useSafeState, useUpdateEffect } from "ahooks";
import { produce } from "immer";
import {
  includes as _includes,
  compact,
  concat,
  forEach,
  isEmpty,
  isEqual,
  map,
  size,
} from "lodash";
import ErrorContext from "./ErrorContext";

import LineTabs from "@/shared/components/LineTabs/LineTabs";
import SuspenseContent from "@/shared/components/SuspenseContent";
import Sending from "@/features/requests/editor/Sending";

import { STATUS_CODE } from "@onapi/http-model/constants/common";
import useSystemConfig from "@/features/settings/store/useSystemConfig";
import { useGlobal } from "@/app/store";
import { BaseResponse } from "@onapi/http-model/requests/types/response";
import {
  ApiSendingData,
  ApiSendingDataSSE,
} from "@onapi/http-model/requests/types/send";

import Empty from "./components/Empty";

const ResponseSize = lazy(
  () => import("@/features/requests/response/ResponseSize"),
);

const Console = lazy(() => import("./components/Console"));
const Cookie = lazy(() => import("./components/Cookie"));
const RealRequest = lazy(() => import("./components/RealRequest"));
const Realtime = lazy(() => import("./components/Realtime/Realtime"));
const ResponseHeader = lazy(() => import("./components/ResponseHeader"));

interface SharedProps {
  sendingData?: HttpExecutionState;
  resultIncludesTabs?: string[];
  tabsDefaultActiveKey?: string;
  includesTabs?: string[];
  extra?: TabsProps["items"];
  showDownload?: boolean;
  showProxy?: boolean;
  showExampleImport?: boolean;
  showSending?: boolean;
  onlySendingLoadingBar?: boolean;
  showResponseSize?: boolean;
  sendAfterResponseToTabDisabled?: boolean;
}
type Props = SharedProps & {
  responseData: import("postman-collection").ResponseDefinition[] | undefined;
  onResponseDataChange: (
    value: import("postman-collection").ResponseDefinition[],
  ) => void;
};

const Response: FC<Props> = memo((props) => {
  const {
    responseData,
    sendingData,
    resultIncludesTabs,
    tabsDefaultActiveKey,
    includesTabs,
    extra,
    showDownload,
    // showExampleImport,
    showProxy,
    showSending = true,
    onlySendingLoadingBar,
    showResponseSize = true,
    sendAfterResponseToTabDisabled = false,
    onResponseDataChange,
  } = props;
  const { t } = useTranslation();
  const nativeResponse = sdkResponseView(sendingData?.response);
  const cancelToken = useGlobal((state) => state.cancelToken);

  const [showError, setShowError] = useSafeState(false);
  const [activeKey, setActiveKey] = useSafeState(
    tabsDefaultActiveKey || "realtime",
  );
  const [visitedTabs, setVisitedTabs] = useState(
    () => new Set([tabsDefaultActiveKey || "realtime"]),
  );

  const isSendDone = useMemo(
    () =>
      !isEmpty(sendingData?.response) &&
      isEqual(sendingData?.sendStatus, "initial"),
    [sendingData],
  );

  const isNotEmpty = useMemo(
    () =>
      isSendDone ||
      isEqual(sendingData?.sendStatus, "sending") ||
      size(sendingData?.streamResponse) > 0 ||
      !_includes(["realtime"], activeKey),
    [isSendDone, sendingData?.sendStatus, activeKey],
  );

  useUpdateEffect(() => {
    if (
      sendingData?.sendStatus === "sendError" &&
      !isEmpty(sendingData?.message)
    ) {
      setShowError(true);
    } else {
      setShowError(false);
    }
  }, [sendingData]);

  useUpdateEffect(() => {
    const { systemConfig } = useSystemConfig.getState();

    if (!isSendDone) {
      return;
    }

    // auto jump to realtime response tab
    if (
      isEqual(systemConfig.send_after_response_to_tab, STATUS_CODE.ENABLE) &&
      !sendAfterResponseToTabDisabled
    ) {
      setActiveKey("realtime");
    }

    // according to system config, whether to save result to response example after sending
    if (isEqual(systemConfig.send_after_save_example, 2)) {
      handleAutoSaveExampleRaw();
    } else if (isEqual(systemConfig.send_after_save_example, 3)) {
      handleAutoSaveExampleRaw();
    }
  }, [isSendDone, sendAfterResponseToTabDisabled]);

  const handleAutoSaveExampleRaw = () => {
    if (sendingData?.response) {
      onResponseDataChange([
        ...(Array.isArray(responseData) ? responseData : []),
        {
          ...sendingData.response,
          body: responseText(sendingData.response),
          originalRequest: sendingData.request,
          name: "Response",
        },
      ]);
      return;
    }
  };

  const originItems: Array<
    TabPaneProps & { countParams?: any; key: string; label: React.ReactNode }
  > = [
    {
      key: "realtime",
      label: t("api.run.response_tab"),
      children: (
        <Realtime
          resultIncludesTabs={resultIncludesTabs}
          sendingData={sendingData}
          responseData={responseData}
          onResponseDataChange={onResponseDataChange}
        />
      ),
    },
    {
      key: "responseHeader",
      label: t("api.run.response_header"),
      children: <ResponseHeader value={nativeResponse?.header} />,
      countParams: {
        dataSource: nativeResponse?.header,
      },
    },
    {
      key: "cookie",
      label: "Cookie",
      children: <Cookie value={sendingData?.cookies} />,
      countParams: {
        dataSource: sendingData?.cookies,
      },
    },
    {
      key: "realRequest",
      label: t("api.run.real_request"),
      children: <RealRequest sendingData={sendingData} />,
      countParams: {
        showDot: !isEmpty(sendingData?.request),
      },
    },
    {
      key: "console",
      label: t("api.run.console"),
      children: <Console sendingData={sendingData} />,
      countParams: {
        dataSource: sendingData?.consoleList,
      },
    },
  ];

  const tabsItems = useMemoizedFn(() => {
    const _originItems = map(originItems, (item) => ({
      ...item,
      children: (
        <SuspenseContent key={item.key}>
          {(visitedTabs.has(item.key) || activeKey === item.key) &&
          (item.key !== "realtime" || !isEmpty(sendingData))
            ? item.children
            : null}
        </SuspenseContent>
      ) as React.ReactNode,
    }));

    const mergeItems = concat([], _originItems, extra);
    const finalItems =
      size(includesTabs) > 0
        ? compact(
            map(includesTabs, (key: string) =>
              mergeItems?.find((item) => item?.key === key),
            ),
          )
        : _originItems;

    return finalItems;
  });

  const handleMemoizedChange = useMemoizedFn((data) =>
    onResponseDataChange(data),
  );

  return (
    <ErrorContext.Provider
      value={{ showError, errorMsg: sendingData?.message || "" }}
    >
      <div className={styles.container}>
        {sendingData?.sendStatus === "sending" && showSending && (
          <Sending
            onCancel={cancelToken}
            onlySendingLoadingBar={onlySendingLoadingBar}
          />
        )}

        {!isNotEmpty && (
          <Empty
            wrapClassName={showError ? undefined : undefined}
            maskMode
            descriptionClassName={styles.emptyDescription}
          />
        )}

        <LineTabs
          activeKey={activeKey}
          onChange={(key) => {
            setVisitedTabs((previous) => new Set([...previous, key]));
            setActiveKey(key);
          }}
          items={tabsItems()}
          tabBarExtraContent={
            !isEmpty(sendingData) &&
            showResponseSize && (
              <Suspense fallback={null}>
                <ResponseSize
                  showProxy={showProxy}
                  showDownload={showDownload && isSendDone}
                  response={sendingData?.response}
                  request={sendingData?.request}
                />
              </Suspense>
            )
          }
          tabListClassName={styles.tabsNavList}
          navWrapClassName={styles.tabsNavWrap}
          navClassName={styles.tabsNav}
          panelsClassName={styles.tabsContent}
          contentClassName={styles.tabsContentHolder}
          className={classNames(styles.tabs, styles.tabsTop)}
        />
      </div>
    </ErrorContext.Provider>
  );
});

export default Response;
