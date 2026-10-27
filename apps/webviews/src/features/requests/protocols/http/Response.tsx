import type {
  HttpEditorProps,
  HttpEditorRecord,
} from "@onapi/domain/requests/record";
import styles from "./Response.module.css";
import { memo } from "react";

import { useMemoizedFn } from "ahooks";
import { produce } from "immer";

import ResponsePanel from "@/features/requests/response/Response/Response";

import useApis from "@/features/requests/store/useApis";

const Response = memo((props: HttpEditorProps) => {
  const { apisData, onApisDataChange } = props;
  const currentSendingData = useApis((store) => store.currentSendingData);
  const handleOnChange = useMemoizedFn((data: HttpEditorRecord["response"]) => {
    const newData = produce(apisData, (draft) => {
      draft.response = data;
    });
    onApisDataChange(newData);
  });

  return (
    <div className={styles.container}>
      <ResponsePanel
        showDownload
        responseData={apisData.response}
        sendingData={currentSendingData}
        onResponseDataChange={handleOnChange}
      />
    </div>
  );
});

export default Response;
