import { create, devtools } from "@/app/store/utils";

type ConnectionStatus = "connect" | "connecting" | "disconnect";

type Pool = {
  [k: string]: {
    status: ConnectionStatus;
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
  startConnection: (targetId: string) => void;
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
      startConnection: (targetId) =>
        set((state) => ({
          websocketConnectionPool: {
            ...state.websocketConnectionPool,
            [targetId]: {
              status: "connecting",
              socketRes:
                state.websocketConnectionPool[targetId]?.socketRes || [],
            },
          },
        })),
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
