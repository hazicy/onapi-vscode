import { hasCompletedResponse } from "@/features/requests/protocols/http/http-state";
import type { HttpExecutionState } from "@/features/requests/protocols/http/http-state";
import { responseText } from "@onapi/domain";
import styles from "./Realtime.module.css";
import { memo, useEffect, useRef } from "react";
import { isEqual } from "lodash-es";
import ResponseResult from "@/features/requests/response/ResponseResult/ResponseResult";
import { STATUS_CODE } from "@onapi/domain/constants/common";
import useSystemConfig from "@/features/settings/store/useSystemConfig";
import {
  isEventStream,
  eventStreamText,
} from "@/features/requests/protocols/http/event-stream";
import EventStream from "./EventStream";

interface Props {
  encoding?: string;
  wordWrap?: boolean;
  viewMode?: string;
  onViewModeChange?: (value: string) => void;
  resultIncludesTabs?: string[];
  sendingData?: HttpExecutionState;
}

const Realtime = memo(({ resultIncludesTabs, sendingData, viewMode, onViewModeChange, encoding, wordWrap }: Props) => {
  const responseResultRef = useRef<any>(null);

  useEffect(() => {
    if (!hasCompletedResponse(sendingData)) {
      return;
    }
    const { systemConfig } = useSystemConfig.getState();
    if (isEqual(systemConfig.send_after_auto_beautify, STATUS_CODE.ENABLE)) {
      responseResultRef.current?.setTabsValue("beautify");
      onViewModeChange?.("beautify");
    }
  }, [sendingData?.session?.status, sendingData?.result]);

  if (isEventStream(sendingData)) {
    return (
      <EventStream
        key={sendingData?.session?.executionId}
        body={
          eventStreamText(sendingData) ||
          responseText(sendingData?.result?.response)
        }
        error={sendingData?.error?.message}
      />
    );
  }

  if (sendingData?.session?.status === "failed") {
    return null;
  }

  return (
    <div className={styles.container}>
      <ResponseResult
        ref={responseResultRef}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        hideModeTabs
        hideToolbar
        encoding={encoding}
        wordWrap={wordWrap}
        resultIncludesTabs={resultIncludesTabs}
        rawHtml={responseText(sendingData?.result?.response)}
        data={sendingData?.result?.response}
      />
    </div>
  );
});

export default Realtime;
