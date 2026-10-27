import styles from "./Response.module.css";
import { memo } from "react";

import { useMemoizedFn } from "ahooks";
import { produce } from "immer";

import ResponsePanel from "@/features/requests/components/Response";
import {
  ApiComponentType,
  ApiDetailsData,
} from "@onapi/http-model/requests/types/api";

import useApis from "@/features/requests/store/useApis";

const Response = memo((props: ApiComponentType) => {
  const { apisData, onApisDataChange } = props;
  const currentSendingData = useApis((store) => store.currentSendingData);
  const handleOnChange = useMemoizedFn((data: ApiDetailsData["response"]) => {
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
