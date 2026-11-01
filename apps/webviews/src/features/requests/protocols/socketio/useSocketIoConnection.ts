import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import { cloneDeep } from "lodash-es";
import useSocketConnectionsStore from "@/features/requests/store/useSocketConnectionsStore";

const useSocketIoConnection = () => {
  const updatePool =
    useSocketConnectionsStore.getState().appendConnectionResult;
  const toggleSocketIoConnection = (
    targetRecord: any,
    status: string,
    temporaryServerId: string,
  ) => {
    const target = cloneDeep(targetRecord);

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
    useSocketConnectionsStore.getState().startConnection(target.id, requestId);

    // Reserve connection identity before the host starts preparing it.
    sendRequestPanelMessage({
      action: "socketio_connect",
      requestId,
      data: {
        option: { server_id: temporaryServerId },
        target,
      },
    });
  };

  return {
    toggleSocketIoConnection,
    updatePool,
  };
};

export default useSocketIoConnection;
