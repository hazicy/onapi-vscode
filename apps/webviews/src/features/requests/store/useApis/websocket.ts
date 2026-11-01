import { create, devtools } from "@/shared/state/store";

import type { ExecutionEnvelope } from "@onapi/contracts";
import {
  reduceSocketExecutionEvent,
  type SocketConnection,
  type SocketTimelineEntry,
  type ConnectionStatus,
} from "@/features/requests/execution/socket-state";

type Pool = Record<string, SocketConnection>;
type State = { websocketConnectionPool: Pool };
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
    data: SocketTimelineEntry | undefined,
    responseData?: Record<string, unknown>,
  ) => void;
  updateWebSocketConnectionPool: (config: Pool) => void;
  consumeExecutionEvent: (event: ExecutionEnvelope) => void;
};

const useApisWebSocket = create<State & Action>()(
  devtools(
    (set) => ({
      websocketConnectionPool: {},
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
                closed: true,
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
                ...previous,
                status,
                requestId: undefined,
                closed: status === "disconnect",
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
      consumeExecutionEvent: (envelope) => {
        if (!envelope.targetId) {
          return;
        }
        const targetId = envelope.targetId;
        set((state) => {
          const previous = state.websocketConnectionPool[targetId];
          const next = reduceSocketExecutionEvent(previous, envelope);
          return next === previous || !next
            ? state
            : {
                websocketConnectionPool: {
                  ...state.websocketConnectionPool,
                  [targetId]: next,
                },
              };
        });
      },
    }),
    { name: "useApisWebSocket" },
  ),
);

export default useApisWebSocket;
