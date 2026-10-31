import {
  editorRecordSchema,
  type EditorRecord,
} from "@onapi/domain/requests/record";
import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import styles from "./RequestWorkspace.module.css";
import { Flex } from "@/shared/ui/base";
import React, { lazy, useEffect, useState } from "react";

import useApis from "@/features/requests/store/useApis";
import { ApiDetailsData } from "@onapi/domain/requests/types/api";

// Reuse the preload promise and render its resolved component synchronously.
// React.lazy alone suspends on its first render even if import() is cached.
function preloadableProtocol<Props extends object>(
  loader: () => Promise<{ default: React.ComponentType<Props> }>,
) {
  let resolved: React.ComponentType<Props> | undefined;
  let pending: ReturnType<typeof loader> | undefined;
  const preload = () => {
    if (!pending) {
      performance.mark("onapi:protocol-start");
      pending = loader().then((module) => {
        resolved = module.default;
        performance.mark("onapi:protocol-ready");
        return module;
      });
    }
    return pending;
  };
  const LazyComponent = lazy(preload);
  return {
    preload,
    Component: (props: Props) => {
      // Keep the element type stable after mounting (including later protocol
      // switches), so resolving a preload cannot reset an editor's local state.
      const [Component] = useState(() => resolved ?? LazyComponent);
      return <Component {...props} />;
    },
  };
}

const protocolLoaders = {
  ai: preloadableProtocol(() => import("./protocols/ai/AiDebug")),
  mcp: preloadableProtocol(() => import("./protocols/mcp/McpDebug")),
  api: preloadableProtocol(() => import("./protocols/http/HttpDebug")),
  folder: preloadableProtocol(
    () => import("../collections/components/FolderEditor/FolderEditor"),
  ),
  websocket: preloadableProtocol(
    () => import("./protocols/websocket/WebSocketDebug"),
  ),
  socketio: preloadableProtocol(
    () => import("./protocols/socketio/SocketIoDebug"),
  ),
  graphql: preloadableProtocol(
    () => import("./protocols/graphql/GraphQLDebug"),
  ),
};
export function preloadRequestProtocol(type: string) {
  const protocol = protocolLoaders[type as keyof typeof protocolLoaders];
  return protocol?.preload();
}
const AiDebug = protocolLoaders.ai.Component;
const McpDebug = protocolLoaders.mcp.Component;
const ApiDebug = protocolLoaders.api.Component;
const Folder = protocolLoaders.folder.Component;
const WebSocketDebug = protocolLoaders.websocket.Component;
const SocketioDebug = protocolLoaders.socketio.Component;
const GraphqlDebug = protocolLoaders.graphql.Component;
if (window.vscodeData?.kind) {
  void preloadRequestProtocol(window.vscodeData.kind)?.catch(() => {});
}
import { APIS_TARGET_TYPE_ENUM } from "@onapi/domain/requests/constants/index";
import { WebSocketDetailsData } from "@onapi/domain/requests/types/websocket";
import { SocketIoDetailsData } from "@onapi/domain/requests/types/socketio";

interface RequestWorkspaceProps {
  value?: ApiDetailsData;
  curApiSendingData?: any;
}

// Inside the Suspense boundary: runs after the selected protocol has committed.
function RequestWorkspaceReady() {
  useEffect(() => {
    performance.mark("onapi:content-ready");
    if (performance.getEntriesByName("onapi:data-ready").length) {
      performance.measure(
        "onapi:data-to-content",
        "onapi:data-ready",
        "onapi:content-ready",
      );
    }
    if (performance.getEntriesByName("onapi:html-ready").length) {
      performance.measure(
        "onapi:html-to-content",
        "onapi:html-ready",
        "onapi:content-ready",
      );
    }
    let secondFrame = 0;
    // Load the collection only after the selected protocol has committed and painted.
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        // Two frames give the committed content a paint opportunity. This is
        // an approximation of display time, not a compositor presentation event.
        performance.mark("onapi:content-painted");
        if (performance.getEntriesByName("onapi:html-ready").length) {
          performance.measure(
            "onapi:html-to-paint",
            "onapi:html-ready",
            "onapi:content-painted",
          );
        }
        const timing = window.vscodeData?.startupTiming;
        if (timing?.panelStartedAt) {
          performance.measure("onapi:open-to-paint", {
            start: timing.openHandledAt - performance.timeOrigin,
            end: performance.now(),
          });
          performance.measure("onapi:open-to-panel", {
            start: timing.openHandledAt - performance.timeOrigin,
            end: timing.panelStartedAt - performance.timeOrigin,
          });
          performance.measure("onapi:panel-to-html", {
            start: timing.panelStartedAt - performance.timeOrigin,
            end: performance.getEntriesByName("onapi:html-ready")[0].startTime,
          });
          performance.measure("onapi:panel-to-paint", {
            start: timing.panelStartedAt - performance.timeOrigin,
            end: performance.now(),
          });
        }
        sendRequestPanelMessage({ action: "getApiList" });
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, []);
  return null;
}

const RequestWorkspace: React.FC<RequestWorkspaceProps> = () => {
  const apisActiveData: EditorRecord = useApis((store) => store.apisActiveData);
  const updateApisActiveData = useApis((store) => store.updateApisActiveData);

  const onApisDataChange = (newData: EditorRecord) => {
    sendRequestPanelMessage({
      action: "updateApiActiveData",
      data: newData,
    });
    updateApisActiveData(newData);
  };

  const renderContainer = () => {
    if (apisActiveData.kind === "ai" || apisActiveData.kind === "mcp") {
      return apisActiveData.kind === "ai" ? (
        <AiDebug
          key={apisActiveData.id}
          apisData={apisActiveData}
          onApisDataChange={onApisDataChange}
        />
      ) : (
        <McpDebug
          key={apisActiveData.id}
          apisData={apisActiveData}
          onApisDataChange={onApisDataChange}
        />
      );
    }
    if (apisActiveData.kind === "api") {
      return (
        <ApiDebug
          apisData={apisActiveData}
          onApisDataChange={onApisDataChange}
        />
      );
    }
    if (apisActiveData.kind === APIS_TARGET_TYPE_ENUM.FOLDER) {
      return (
        <Folder
          apisData={apisActiveData as unknown as ApiDetailsData}
          onApisDataChange={(value) =>
            onApisDataChange(editorRecordSchema.parse(value))
          }
        />
      );
    }
    if (apisActiveData.kind === "websocket") {
      return (
        <WebSocketDebug
          apisData={apisActiveData as WebSocketDetailsData}
          onApisDataChange={(val) => {
            onApisDataChange(editorRecordSchema.parse(val));
          }}
        />
      );
    }
    if (apisActiveData.kind === "socketio") {
      return (
        <SocketioDebug
          apisData={apisActiveData as SocketIoDetailsData}
          onApisDataChange={(val) => {
            onApisDataChange(editorRecordSchema.parse(val));
          }}
        />
      );
    }
    if (apisActiveData.kind === "graphql") {
      return (
        <GraphqlDebug
          apisData={apisActiveData}
          onApisDataChange={onApisDataChange}
        />
      );
    }
    return <></>;
  };

  return (
    <>
      {
        <Flex vertical className={styles.apiDebug}>
          {renderContainer()}
          {apisActiveData.id && <RequestWorkspaceReady />}
        </Flex>
      }
    </>
  );
};

export default RequestWorkspace;
