import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import { cloneDeep, isEqual } from "lodash-es";

import useWebSocketStore from "@/features/requests/store/useApis/websocket";

const useWebSocket = () => {
  const updatePool = useWebSocketStore.getState().appendConnectionResult;
  const connectWebSocket = (
    ITarget: any,
    status: string,
    curServerId: string,
  ) => {
    const target = cloneDeep(ITarget);

    // Currently connecting
    if (["connecting", "connect"].includes(status)) {
      // Disconnect
      sendRequestPanelMessage({
        action: "ws_disconnect",
        data: target?.id,
      });
      updatePool(target?.id, "disconnect", {});
      return false;
    }

    const requestId = crypto.randomUUID();
    useWebSocketStore.getState().startConnection(target.id, requestId);

    // WebSocket connection request
    sendRequestPanelMessage({
      action: "ws_connect",
      requestId,
      data: {
        option: { server_id: curServerId },
        target,
      },
    });
  };

  const handelWsResult = (event: any) => {
    const { message, id } = event;
    switch (event?.action) {
      case "connected":
        if (message?.isSuccess) {
          updatePool(
            id,
            "connect",
            {
              action: "connect",
              message,
            },
            message.data,
          );
        } else {
          updatePool(id, "disconnect", {
            action: "error",
            message: message,
          });
        }
        break;
      case "received":
        const { type, isSuccess } = message || {};
        if (isEqual(type, "close")) {
          updatePool(id, "disconnect", {
            action: isSuccess ? "disconnect" : "error",
            message: message,
          });
          return;
        }
        updatePool(id, "connect", {
          action: type,
          message: message,
        });
        break;
      case "error":
        updatePool(id, "disconnect", {
          action: "error",
          message: message,
        });
        break;
      default:
        break;
    }
  };

  return {
    connectWebSocket,
    updatePool,
    handelWsResult,
  };
};

export default useWebSocket;
