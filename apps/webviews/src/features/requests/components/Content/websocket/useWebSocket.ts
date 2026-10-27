import { cloneDeep, isEqual } from "lodash";

import useWebSocketStore from "@/features/requests/store/useApis/websocket";

import { getWebSocketSendOptions } from "./utils";

const useWebSocket = () => {
  const updatePool = useWebSocketStore.getState().appendConnectionResult;
  const connectWebSocket = async (
    ITarget: any,
    status: string,
    curServerId: string,
  ) => {
    const target = cloneDeep(ITarget);

    // Currently connecting
    if (["connecting", "connect"].includes(status)) {
      // Disconnect
      window?.vscode.postMessage({
        action: "ws_disconnect",
        data: target?.id,
      });
      updatePool(target?.id, "disconnect", {});
      return false;
    }

    // WebSocket connection preprocessing
    const options: any = await getWebSocketSendOptions(target);
    useWebSocketStore.getState().startConnection(target.id);

    options.server_id = curServerId;

    // WebSocket connection request
    window?.vscode.postMessage({
      action: "ws_connect",
      data: {
        option: options,
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
