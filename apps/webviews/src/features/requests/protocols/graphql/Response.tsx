import styles from "./Response.module.css";
import { memo } from "react";

import { useMemoizedFn } from "ahooks";
import { produce } from "immer";

import ResponsePanel from "@/features/requests/response/Response/Response";
import useApis from "@/features/requests/store/useApis";
import {
  ApiComponentType,
  GraphQLDetailsData,
} from "@onapi/domain/requests/types/graphql";

const Response = memo((props: ApiComponentType) => {
  const { apisData, onApisDataChange } = props;

  const curApiSendingData = useApis((state) => state.currentSendingData);

  const handleOnChange = useMemoizedFn(
    (data: GraphQLDetailsData["response"]) => {
      const newData = produce(apisData, (draft) => {
        draft.response = data;
      });
      onApisDataChange(newData);
    },
  );

  return (
    <div className={styles.container}>
      <ResponsePanel
        showDownload
        resultIncludesTabs={["beautify", "visualization"]}
        includesTabs={[
          "realtime",
          "requestHeader",
          "responseHeader",
          "cookie",
          "realRequest",
          "console",
        ]}
        responseData={apisData.response}
        sendingData={curApiSendingData}
        onResponseDataChange={handleOnChange}
      />
    </div>
  );
});

export default Response;
