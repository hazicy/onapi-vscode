import {
  httpResponseSchema,
  type HttpEditorRecord,
} from "@onapi/domain/requests/record";
import { hasCompletedResponse } from "@/features/requests/execution/http-state";
import tabSelection from "@/shared/components/LineTabs/LineTabs.module.css";
import type { HttpExecutionState } from "@/features/requests/execution/http-state";
import { sdkResponseView } from "@/features/requests/utils/executionView";
import clsx from "clsx";
import { responseText } from "@onapi/domain";
import styles from "./Response.module.css";
import { FC, lazy, memo, Suspense, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { TabPaneProps, TabsProps } from "@/shared/ui/base";

import { useMemoizedFn, useSafeState, useUpdateEffect } from "ahooks";
import { compact, isEmpty, isEqual, map, size } from "lodash-es";

import LineTabs from "@/shared/components/LineTabs/LineTabs";
import SuspenseContent from "@/shared/components/SuspenseContent";
import Sending from "@/features/requests/editor/Sending";

import { STATUS_CODE } from "@onapi/domain/constants/common";
import useSystemConfig from "@/features/settings/store/useSystemConfig";

import Empty from "./components/Empty";

const ResponseSize = lazy(
  () => import("@/features/requests/response/ResponseSize"),
);

const ResponseAssert = lazy(
  () => import("@/features/requests/assertions/ResponseAssert/ResponseAssert"),
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
  responseData: HttpEditorRecord["response"];
  onResponseDataChange: (
    value: NonNullable<HttpEditorRecord["response"]>,
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
  const nativeResponse = sdkResponseView(sendingData?.result?.response);

  const [selectedKey, setActiveKey] = useSafeState(
    tabsDefaultActiveKey || "realtime",
  );
  const hasExecution = !!sendingData && sendingData.status !== "idle";
  const initialTabKey = tabsDefaultActiveKey || "realtime";
  const activeKey = hasExecution ? selectedKey : initialTabKey;
  const [visitedTabs, setVisitedTabs] = useState(
    () => new Set([tabsDefaultActiveKey || "realtime"]),
  );

  const isSendDone = hasCompletedResponse(sendingData);
  const isNotEmpty =
    (sendingData?.status !== "failed" && !!sendingData?.result?.response) ||
    sendingData?.status === "sending" ||
    activeKey !== "realtime";

  const handledCompletion = useRef<string | undefined>(undefined);
  useUpdateEffect(() => {
    const { systemConfig } = useSystemConfig.getState();

    if (!isSendDone || handledCompletion.current === sendingData?.executionId) {
      return;
    }

    handledCompletion.current = sendingData?.executionId;

    // auto jump to realtime response tab
    if (
      isEqual(systemConfig.send_after_response_to_tab, STATUS_CODE.ENABLE) &&
      !sendAfterResponseToTabDisabled
    ) {
      setActiveKey("realtime");
    }

    // according to system config, whether to save result to response example after sending
    if ([2, 3].includes(systemConfig.send_after_save_example)) {
      handleAutoSaveExampleRaw();
    }
  }, [
    sendingData?.status,
    sendingData?.executionId,
    sendAfterResponseToTabDisabled,
  ]);

  const handleAutoSaveExampleRaw = () => {
    if (sendingData?.result?.response) {
      onResponseDataChange([
        ...(Array.isArray(responseData) ? responseData : []),
        httpResponseSchema.parse({
          ...sendingData.result.response,
          body: responseText(sendingData.result.response),
          originalRequest: sendingData.result.request,
          name: "Response",
        }),
      ]);
      return;
    }
  };

  const assertions = sendingData?.assertions || [];
  const passedTests = assertions.filter(
    (item) => !item.error && !item.skipped,
  ).length;

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
      children: <Cookie value={sendingData?.result?.cookies} />,
      countParams: {
        dataSource: sendingData?.result?.cookies,
      },
    },
    {
      key: "realRequest",
      label: t("api.run.real_request"),
      children: <RealRequest sendingData={sendingData} />,
    },
    {
      key: "testResults",
      label: (
        <span className={styles.testResultsLabel}>
          {t("common.test_component.title")}
          {assertions.length > 0 && (
            <span className={styles.testResultsCount}>
              {passedTests}/{assertions.length}
            </span>
          )}
        </span>
      ),
      children: <ResponseAssert sendingData={sendingData} />,
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

    const mergeItems = [..._originItems, ...(extra ?? [])];
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

  if (!hasExecution) {
    return (
      <div className={styles.container}>
        <Empty />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {sendingData?.status === "sending" && showSending && (
        <Sending
          hasCancel={false}
          onlySendingLoadingBar={onlySendingLoadingBar}
        />
      )}

      {!isNotEmpty && (
        <Empty
          errorMessage={
            sendingData?.status === "failed"
              ? sendingData.error?.message || t("request_panel.failed")
              : undefined
          }
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
                response={sendingData?.result?.response}
                request={sendingData?.result?.request}
              />
            </Suspense>
          )
        }
        tabListClassName={tabSelection.selectionList}
        navWrapClassName={styles.tabsNavWrap}
        navClassName={styles.tabsNav}
        panelsClassName={styles.tabsContent}
        contentClassName={styles.tabsContentHolder}
        className={clsx(styles.tabs, styles.tabsTop)}
      />
    </div>
  );
});

export default Response;
