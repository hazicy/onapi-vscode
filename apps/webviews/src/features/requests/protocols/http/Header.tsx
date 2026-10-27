import {
  beginRequest,
  cancelRequest,
} from "@/features/requests/utils/requestExecution";
import { requestUrl, requestMethod, editedUrl } from "@onapi/domain";
import { ApiComponentType } from "@onapi/domain/requests/types/api";
import { AnyObject } from "@onapi/domain/types/common";
import { produce } from "immer";
import React, { FC, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { isArray, isEqual } from "lodash-es";
import {
  genQueryByUrl,
  genRestfulByUrl,
  getNewApisDataByCurlChange,
} from "@/features/requests/utils/apis";
import UrlGroup from "@/features/requests/editor/UrlGroup";
import useApis from "@/features/requests/store/useApis";
import { Icon } from "@iconify/react";
import sendHorizontal from "@iconify-icons/lucide/send-horizontal";
import square from "@iconify-icons/lucide/square";
import styles from "./Header.module.css";

import { CurlDataType } from "@/features/requests/types/other";

const Header: FC<ApiComponentType> = ({ apisData, onApisDataChange, type }) => {
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
  const isSending = isEqual(currentSendingData?.sendStatus, "sending");

  const handleSend = (option?: { server_id: string }) => {
    if (!beginRequest()) {
      return;
    }
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
            aria-label={t(
              isSending ? "supplement.cancel_send" : "api.run.send",
            )}
            title={
              isSending
                ? t("supplement.cancel_send")
                : `${t("api.run.send")} (Ctrl/Cmd+Enter)`
            }
            onClick={() => (isSending ? cancelRequest() : handleSend())}
          >
            <Icon icon={isSending ? square : sendHorizontal} width={18} />
            <span className={styles.sendLabel}>
              {t(isSending ? "supplement.cancel_send" : "api.run.send")}
            </span>
          </button>
        }
      />
    </div>
  );
};

export default Header;
