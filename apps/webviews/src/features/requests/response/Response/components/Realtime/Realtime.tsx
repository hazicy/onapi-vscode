import { hasCompletedResponse } from "@/features/requests/execution/http-state";
import type { HttpExecutionState } from "@/features/requests/execution/http-state";
import { responseText } from "@onapi/domain";
import styles from "./Realtime.module.css";
import { memo, useEffect, useRef } from "react";
import { isEqual } from "lodash-es";
import ResponseResult from "@/features/requests/response/ResponseResult/ResponseResult";
import { STATUS_CODE } from "@onapi/domain/constants/common";
import useSystemConfig from "@/features/settings/store/useSystemConfig";

interface Props {
  resultIncludesTabs?: string[];
  sendingData?: HttpExecutionState;
}

const Realtime = memo(({ resultIncludesTabs, sendingData }: Props) => {
  const responseResultRef = useRef<any>(null);

  useEffect(() => {
    if (!hasCompletedResponse(sendingData)) {
      return;
    }
    const { systemConfig } = useSystemConfig.getState();
    if (isEqual(systemConfig.send_after_auto_beautify, STATUS_CODE.ENABLE)) {
      responseResultRef.current?.setTabsValue("beautify");
    }
  }, [sendingData?.status, sendingData?.result]);

  if (sendingData?.status === "failed") {
    return null;
  }

  return (
    <div className={styles.container}>
      <ResponseResult
        ref={responseResultRef}
        resultIncludesTabs={resultIncludesTabs}
        rawHtml={responseText(sendingData?.result?.response)}
        data={sendingData?.result?.response}
        html={sendingData?.result?.visualizerHtml}
      />
    </div>
  );
});

export default Realtime;
