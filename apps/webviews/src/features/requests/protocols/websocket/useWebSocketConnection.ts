import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import { cloneDeep } from "lodash-es";

import useSocketConnectionsStore from "@/features/requests/store/useSocketConnectionsStore";

const useWebSocketConnection = () => {
  const updatePool =
    useSocketConnectionsStore.getState().appendConnectionResult;
  const toggleWebSocketConnection = (
    targetRecord: any,
    status: string,
    curServerId: string,
  ) => {
    const target = cloneDeep(targetRecord);

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
    useSocketConnectionsStore.getState().startConnection(target.id, requestId);

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
    toggleWebSocketConnection,
    updatePool,
  };
};

export default useWebSocketConnection;
