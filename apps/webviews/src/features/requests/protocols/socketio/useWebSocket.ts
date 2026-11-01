import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import { cloneDeep, isPlainObject, isString, setWith } from "lodash-es";

import useWebSocketStore from "@/features/requests/store/useApis/websocket";

import { message } from "@/shared/ui/base";
import { useTranslation } from "react-i18next";
import useApis from "@/features/requests/store/useApis";
import useUserConfig from "@/features/auth/store/useUserConfig";
import { useStorage } from "@/app/store";
import { produce } from "immer";
import { AuthOauth2 } from "@onapi/domain/requests/types/auth";

const useWebSocket = () => {
  const { t } = useTranslation();
  const updatePool = useWebSocketStore.getState().appendConnectionResult;
  const connectWebSocket = (
    ITarget: any,
    status: string,
    temporaryServerId: string,
  ) => {
    const target = cloneDeep(ITarget);

    if (["connecting", "connect"].includes(status)) {
      // Disconnect
      sendRequestPanelMessage({
        action: "socketio_disconnect",
        data: target?.id,
      });
      updatePool(target?.id, "disconnect", {});
      return false;
    }

    const requestId = crypto.randomUUID();
    useWebSocketStore.getState().startConnection(target.id, requestId);

    // WebSocket connection request
    sendRequestPanelMessage({
      action: "socketio_connect",
      requestId,
      data: {
        option: { server_id: temporaryServerId },
        target,
      },
    });
  };

  const handleSetToken = (data: any) => {
    const { updateApisActiveData, apisActiveData } = useApis.getState();
    const { oauthRefreshData, updateOauthRefreshData } = useStorage.getState();
    const { uid } = useUserConfig.getState().userInfo;
    if (
      apisActiveData.kind === "ai" ||
      apisActiveData.kind === "mcp" ||
      apisActiveData.kind === "grpc"
    ) {
      return;
    }
    if (data?.access_token) {
      message.success(t("common.auth.get_access_success"));

      if (apisActiveData) {
        const newData = produce(apisActiveData, (draft) => {
          draft.request.auth = {
            ...draft.request.auth,
            oauth2: {
              ...((draft.request.auth?.oauth2 || {}) as AuthOauth2),
              access_token: isString(data?.access_token)
                ? data?.access_token
                : JSON.stringify(data?.access_token),
            },
          };
        });
        updateApisActiveData?.(newData);
      }
    } else {
      message.error(t("common.auth.get_access_fail"));
    }
    if (data?.refresh_token) {
      const newOauthRefreshData = cloneDeep(oauthRefreshData);
      setWith(
        newOauthRefreshData,
        [uid, apisActiveData?.request?.auth?.oauth2?.clientId || ""],
        data,
        Object,
      );
      updateOauthRefreshData(newOauthRefreshData);
    }
  };

  const handleProxyFetchResult = (event: {
    code: number;
    data?: unknown;
    error?: unknown;
  }) => {
    const { code, data } = event;
    if (code !== 200 || !isPlainObject(data)) {
      message.error(t("common.auth.get_access_fail"));
      return;
    }
    handleSetToken(data);
  };

  return {
    connectWebSocket,
    updatePool,
    handleProxyFetchResult,
  };
};

export default useWebSocket;
