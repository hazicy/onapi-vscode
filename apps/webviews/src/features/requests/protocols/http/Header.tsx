import RequestToolbar from "@/features/requests/components/RequestToolbar";
import RequestAction from "@/features/requests/components/RequestAction";
import type { HttpEditorProps } from "@onapi/domain/requests/record";
import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import {
  beginRequest,
  cancelRequest,
} from "@/features/requests/utils/requestExecution";
import { requestUrl, requestMethod, editedUrl } from "@onapi/domain";

import { AnyObject } from "@onapi/domain/types/common";
import { produce } from "immer";
import React, { FC, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { isEqual } from "lodash-es";
import { getNewApisDataByCurlChange } from "@/features/requests/utils/apis";
import UrlGroup from "@/features/requests/editor/UrlGroup";
import useApis from "@/features/requests/store/useApis";
import styles from "./Header.module.css";

import { CurlDataType } from "@/features/requests/types/other";

const Header: FC<HttpEditorProps> = ({ apisData, onApisDataChange, type }) => {
  const { t } = useTranslation();
  const currentSendingData = useApis((store) => store.currentSendingData);

  const [curServerId, SetCurServerId] = useState("");

  const handleChange = (key: string, value: string) => {
    onApisDataChange(
      produce(apisData, (draft: AnyObject) => {
        if (key === "url") {
          draft.request.url = editedUrl(value, draft.request.url);
        } else if (key === "method") {
          draft.request.method = value;
        } else {
          draft[key] = value;
        }
      }),
    );
  };
  const isSending = isEqual(currentSendingData?.session?.status, "running");

  const handleSend = (option?: { server_id: string }) => {
    const executionId = beginRequest();
    if (!executionId) {
      return;
    }
    sendRequestPanelMessage({
      action: "sendApi",
      executionId,
      data: { ...apisData, kind: "api" },
      option: {
        server_id: curServerId,
        ...option,
      },
    });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Disable Enter key send when using modifier shortcuts
    const ctrlDown = event.metaKey || event.ctrlKey;
    if (event?.keyCode === 13 && !ctrlDown) {
      setTimeout(() => {
        handleSend();
      }, 100);
    }
  };

  const urlGroupData = useMemo(
    () => ({
      url: requestUrl(apisData),
      method: requestMethod(apisData),
      protocol: apisData.protocol,
    }),
    [apisData],
  );

  const curlChange = (d: CurlDataType) => {
    const newData = getNewApisDataByCurlChange(apisData, d);
    onApisDataChange(newData);
  };

  return (
    <RequestToolbar className={styles.container}>
      <UrlGroup
        className={styles.urlGroupWrap}
        type={type || "api"}
        maxLength={10240}
        data={urlGroupData}
        placeholder={t("api.common.curl_placeholder")}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        curServerId={curServerId}
        SetCurServerId={SetCurServerId}
        curlChange={curlChange}
        hideProtocol
        supportCurlImport
        style={{
          paddingRight: "0",
        }}
        urlGroupExtraContent={
          <RequestAction
            label={t(isSending ? "supplement.cancel_send" : "api.run.send")}
            stopping={isSending}
            title={
              isSending
                ? t("supplement.cancel_send")
                : `${t("api.run.send")} (Ctrl/Cmd+Enter)`
            }
            onClick={() => (isSending ? cancelRequest() : handleSend())}
          />
        }
      />
    </RequestToolbar>
  );
};

export default Header;
