import { useEffect, useState } from "react";
import WebSocketDebug from "@/features/requests/protocols/websocket/WebSocketDebug";
import SocketIoDebug from "@/features/requests/protocols/socketio/SocketIoDebug";
import useRequestWorkspaceStore from "@/features/requests/store/useRequestWorkspaceStore";
import useSocketConnectionsStore from "@/features/requests/store/useSocketConnectionsStore";
import {
  DEFAULT_WEBSOCKET_MESSAGE,
  DEFAULT_SOCKETIO_REQUEST,
} from "@onapi/domain/requests/constants/request";
import workspaceStyles from "@/features/requests/RequestWorkspace.module.css";

export default function SocketWorkspaceFixture() {
  const socketio =
    new URLSearchParams(location.search).get("socketWorkspace") === "socketio";
  const [width, setWidth] = useState(1000);
  const [item, setItem] = useState<any>({
    id: "socket-ui",
    kind: "api",
    name: "Socket workspace",
    parentId: "0",
    project_id: "-1",
    target_type: socketio ? "socketio" : "websocket",
    url: socketio ? "http://localhost:3000" : "ws://localhost:3000",
    request: structuredClone(DEFAULT_SOCKETIO_REQUEST),
    config: {},
    message: [
      {
        ...structuredClone(DEFAULT_WEBSOCKET_MESSAGE),
        param_id: "first",
        name: "Greeting",
        request: { ...DEFAULT_WEBSOCKET_MESSAGE.request, raw: "hello" },
      },
    ],
    active_id: "first",
    msg_data: "chat",
    ack: -1,
  });
  useEffect(() => {
    useRequestWorkspaceStore.getState().setActiveRequest(item);
  }, [item]);
  window.vscode = {
    postMessage: (message: unknown) => {
      (window as any).socketMessages ||= [];
      (window as any).socketMessages.push(message);
    },
  } as typeof window.vscode;
  const Debug = socketio ? SocketIoDebug : WebSocketDebug;
  return (
    <>
      <button onClick={() => setWidth(420)}>Narrow panel</button>
      <button onClick={() => setWidth(1000)}>Wide panel</button>
      <button
        onClick={() =>
          useSocketConnectionsStore.getState().updateWebSocketConnectionPool({
            "socket-ui": {
              session: {
                executionId: "socket-fixture",
                sequence: 1,
                status: "running",
                opened: true,
              },
              socketRes: [
                {
                  action: "message",
                  message: socketio
                    ? {
                        fitForShow: "Monaco",
                        dataType: "text",
                        message: "server reply",
                      }
                    : {
                        fitForShow: "Monaco",
                        dataType: "text",
                        data: "server reply",
                      },
                },
              ],
            },
          })
        }
      >
        Connected fixture
      </button>
      <section
        aria-label="Socket workspace"
        className={workspaceStyles.apiDebug}
        style={{
          width,
          height: 720,
          display: "flex",
          flexDirection: "column",
          fontFamily: "sans-serif",
        }}
      >
        <Debug apisData={item} onApisDataChange={setItem} />
      </section>
      <output aria-label="Socket definition">{JSON.stringify(item)}</output>
    </>
  );
}
