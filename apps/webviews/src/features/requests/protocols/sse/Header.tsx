import { requestUrl, requestMethod, editedUrl } from "@onapi/http-model";
import styles from "./Header.module.css";

import { ApiComponentType } from "@onapi/http-model/requests/types/api";
import { AnyObject } from "@onapi/http-model/types/common";
import { Button, Flex } from "@/shared/ui/base";
import { produce } from "immer";
import React, { FC, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { isArray, isEqual } from "lodash";
import { genQueryByUrl, genRestfulByUrl } from "@/features/requests/utils/apis";
import UrlGroup from "@/features/requests/editor/UrlGroup";
import useApis from "@/features/requests/store/useApis";

import { snowflakeId } from "@onapi/http-model/utils/data-tools";

const Header: FC<ApiComponentType> = ({ apisData, onApisDataChange, type }) => {
  const { t } = useTranslation();
  const currentSendingData = useApis((state) => state.currentSendingData);
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
    // Reset before sending

    updateCurrentSendingData({
      id: apisData?.id,
      sendStatus: "sending",
      streamResponse: [
        {
          action: "connect",
          id: snowflakeId(),
          data: requestUrl(apisData),
          error: null,
          msg: "success",
        },
      ],
    });

    window?.vscode.postMessage({
      action: "sendSse",
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

  const handleStop = () => {
    // Terminate send thread
    window?.vscode.postMessage({
      action: "stopSendApi",
    });

    const newCurApiSendingDataSSE = produce(
      currentSendingData || {},
      (draft) => {
        draft.id = apisData.id;
        draft.sendStatus = "initial";
        draft.streamResponse?.push({
          action: "disconnect",
          data: requestUrl(apisData),
          error: null,
          msg: "success",
          id: snowflakeId(),
        });
      },
    );

    updateCurrentSendingData(newCurApiSendingDataSSE);
  };

  return (
    <div className={styles.container}>
      <UrlGroup
        className={styles.urlGroupWrap}
        type={type || "sse"}
        maxLength={10240}
        data={urlGroupData}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        curServerId={curServerId}
        SetCurServerId={SetCurServerId}
        style={{
          paddingRight: "0",
        }}
        urlGroupExtraContent={
          <Button
            type="primary"
            size="middle"
            onClick={() => (isSending ? handleStop() : handleSend())}
            style={{
              padding: 0,
              fontSize: "13px",
              borderRadius: "0 4px 4px 0",
              marginLeft: "4px",
            }}
            className={styles.button}
          >
            {isSending ? `${t("api.run.close_connection")}` : t("api.run.send")}
          </Button>
        }
      />
      <Flex gap={4} align="center">
        <Button
          type="default"
          size="middle"
          onClick={() => {
            window?.vscode.postMessage({
              action: "saveApiData",
              data: apisData,
            });
          }}
          style={{ padding: 0, fontSize: "13px" }}
          className={styles.button}
        >
          {t("api.run.save")}
        </Button>
      </Flex>
    </div>
  );
};

export default Header;
