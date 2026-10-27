import type {
  HttpEditorProps,
  HttpEditorRecord,
} from "@onapi/domain/requests/record";
import styles from "./Response.module.css";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useMemoizedFn } from "ahooks";
import { produce } from "immer";

import ResponsePanel from "@/features/requests/response/Response/Response";
import useApis from "@/features/requests/store/useApis";

import Realtime from "./components/Realtime";

const Response = memo((props: HttpEditorProps) => {
  const { apisData, onApisDataChange } = props;
  const { t } = useTranslation();

  const curApiSendingDataSSE = useApis((state) => state.currentSendingData);

  const showResponseSize = useMemo(() => {
    return (
      curApiSendingDataSSE?.status !== "sending" &&
      !!curApiSendingDataSSE?.result?.response
    );
  }, [curApiSendingDataSSE]);

  const extraBeforeItem = [
    {
      key: "customRealtime",
      label: t("api.run.response_tab"),
      children: <Realtime sendingDataSSE={curApiSendingDataSSE} />,
    },
  ];

  const handleOnChange = useMemoizedFn((data: HttpEditorRecord["response"]) => {
    const newData = produce(apisData, (draft) => {
      draft.response = data;
    });

    onApisDataChange(newData);
  });

  return (
    <div className={styles.container}>
      <ResponsePanel
        onlySendingLoadingBar
        sendAfterResponseToTabDisabled
        showResponseSize={showResponseSize}
        showExampleImport={false}
        extra={extraBeforeItem}
        responseData={apisData.response}
        sendingData={curApiSendingDataSSE}
        tabsDefaultActiveKey="customRealtime"
        includesTabs={[
          "customRealtime",
          "requestHeader",
          "responseHeader",
          "cookie",
          "responseExample",
          "realRequest",
          "testResults",
          "console",
        ]}
        onResponseDataChange={handleOnChange}
      />
    </div>
  );
});

export default Response;
