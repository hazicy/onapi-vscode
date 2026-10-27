import { create, devtools } from "@/shared/state/store";

type ConnectionStatus = "connect" | "connecting" | "disconnect";

type Pool = {
  [k: string]: {
    status: ConnectionStatus;
    requestId?: string;
    socketRes: any[];
    responseData?: any;
  };
};
type State = {
  websocketConnectionPool: Pool;
  aborts: {
    [k: string]: any;
  };
};

type Action = {
  startConnection: (targetId: string, requestId?: string) => void;
  failConnection: (
    targetId: string,
    requestId: string,
    error: { message: string },
  ) => void;
  appendConnectionResult: (
    targetId: string,
    status: ConnectionStatus,
    data: any,
    responseData?: any,
  ) => void;
  updateWebSocketConnectionPool: (config: Pool) => void;
  updateWebSocketaborts: (config: Pool) => void;
};

const useApisWebSocket = create<State & Action>()(
  devtools(
    (set) => ({
      websocketConnectionPool: {},
      aborts: {},
      startConnection: (targetId, requestId) =>
        set((state) => ({
          websocketConnectionPool: {
            ...state.websocketConnectionPool,
            [targetId]: {
              status: "connecting",
              requestId,
              socketRes:
                state.websocketConnectionPool[targetId]?.socketRes || [],
            },
          },
        })),
      failConnection: (targetId, requestId, error) => {
        set((state) => {
          const previous = state.websocketConnectionPool[targetId];
          if (
            previous?.status !== "connecting" ||
            previous.requestId !== requestId
          ) {
            return state;
          }
          return {
            websocketConnectionPool: {
              ...state.websocketConnectionPool,
              [targetId]: {
                ...previous,
                status: "disconnect",
                requestId: undefined,
                socketRes: [
                  ...previous.socketRes,
                  {
                    action: "error",
                    message: {
                      type: "error",
                      isSuccess: false,
                      message: error.message,
                    },
                  },
                ],
              },
            },
          };
        });
      },
      appendConnectionResult: (targetId, status, data, responseData) => {
        if (!data) {
          return;
        }
        set((state) => {
          const previous = state.websocketConnectionPool[targetId];
          return {
            websocketConnectionPool: {
              ...state.websocketConnectionPool,
              [targetId]: {
                status,
                socketRes: [...(previous?.socketRes || []), { ...data }],
                responseData: {
                  ...previous?.responseData,
                  ...(responseData || {}),
                },
              },
            },
          };
        });
      },
      /** update websocket connection pool */
      updateWebSocketConnectionPool: (config) => {
        set({
          websocketConnectionPool: { ...config },
        });
      },
      updateWebSocketaborts: (config) => {
        set({
          aborts: { ...config },
        });
      },
    }),
    { name: "useApisWebSocket" },
  ),
);

export default useApisWebSocket;
