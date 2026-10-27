import { requestUrl, requestMethod, editedUrl } from "@onapi/http-model";
import { ApiComponentType } from "@onapi/http-model/requests/types/api";
import { AnyObject } from "@onapi/http-model/types/common";
import { produce } from "immer";
import React, { FC, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { isArray, isEqual } from "lodash";
import {
  genQueryByUrl,
  genRestfulByUrl,
  getNewApisDataByCurlChange,
} from "@/features/requests/utils/apis";
import UrlGroup from "@/features/requests/components/UrlGroup";
import useApis from "@/features/requests/store/useApis";
import { Icon } from "@iconify/react";
import sendHorizontal from "@iconify-icons/lucide/send-horizontal";
import loaderCircle from "@iconify-icons/lucide/loader-circle";
import styles from "./Header.module.css";

import { CurlDataType } from "@/features/requests/types/other";

const Header: FC<ApiComponentType> = ({ apisData, onApisDataChange, type }) => {
  const { t } = useTranslation();
  const currentSendingData = useApis((store) => store.currentSendingData);
  const updateCurrentSendingData = useApis(
    (store) => store.updateCurrentSendingData,
  );

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
  const isSending = isEqual(currentSendingData?.sendStatus, "sending");

  const handleSend = (option?: { server_id: string }) => {
    updateCurrentSendingData({ sendStatus: "sending" });
    window?.vscode.postMessage({
      action: "sendApi",
      data: apisData,
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
    <div className={styles.container}>
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
          <button
            type="button"
            className={styles.sendButton}
            aria-label={t(isSending ? "api.run.sending" : "api.run.send")}
            title={t(isSending ? "api.run.sending" : "api.run.send")}
            onClick={() => handleSend()}
            disabled={isSending}
          >
            <Icon
              icon={isSending ? loaderCircle : sendHorizontal}
              width={18}
              className={isSending ? styles.spinning : undefined}
            />
          </button>
        }
      />
    </div>
  );
};

export default Header;
