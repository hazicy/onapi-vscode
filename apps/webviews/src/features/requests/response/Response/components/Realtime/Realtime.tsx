import type { HttpExecutionState } from "@/features/requests/execution/http-state";
import { responseText } from "@onapi/domain";
import styles from "./Realtime.module.css";
import { memo, useContext, useEffect, useRef } from "react";
import { isEqual } from "lodash-es";
import ResponseResult from "@/features/requests/response/ResponseResult/ResponseResult";
import ErrorContext from "@/features/requests/response/Response/ErrorContext";
import Error from "@/features/requests/response/Response/components/Error";
import { STATUS_CODE } from "@onapi/domain/constants/common";
import useSystemConfig from "@/features/settings/store/useSystemConfig";

interface Props {
  resultIncludesTabs?: string[];
  sendingData?: HttpExecutionState;
}

const Realtime = memo(({ resultIncludesTabs, sendingData }: Props) => {
  const { showError, errorMsg } = useContext(ErrorContext);
  const responseResultRef = useRef<any>(null);

  useEffect(() => {
    if (sendingData?.sendStatus !== "initial") {
      return;
    }
    const { systemConfig } = useSystemConfig.getState();
    if (isEqual(systemConfig.send_after_auto_beautify, STATUS_CODE.ENABLE)) {
      responseResultRef.current?.setTabsValue("beautify");
    }
  }, [sendingData]);

  if (showError) {
    return <Error errorMessage={errorMsg || ""} />;
  }

  return (
    <div className={styles.container}>
      <ResponseResult
        ref={responseResultRef}
        resultIncludesTabs={resultIncludesTabs}
        rawHtml={responseText(sendingData?.response)}
        data={sendingData?.response}
        html={sendingData?.visualizerHtml}
      />
    </div>
  );
});

export default Realtime;
