import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import { cloneDeep } from "lodash-es";

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

  return {
    connectWebSocket,
    updatePool,
  };
};

export default useWebSocket;
