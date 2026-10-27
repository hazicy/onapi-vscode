import styles from "./index.module.css";
import { Flex } from "@/shared/ui/base";
import React, { lazy, useEffect, useState } from "react";

import { useApis } from "@/app/store";
import { ApiDetailsData, ApisData } from "@onapi/http-model/requests/types/api";

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
  api: preloadableProtocol(() => import("./api/Debug")),
  sse: preloadableProtocol(() => import("./sse/Debug")),
  folder: preloadableProtocol(() => import("./Folder")),
  websocket: preloadableProtocol(() => import("./websocket/Debug")),
  socketio: preloadableProtocol(() => import("./socketio/Debug")),
  graphql: preloadableProtocol(() => import("./graphql/Debug")),
};
export function preloadRequestProtocol(type: string) {
  const protocol = protocolLoaders[type as keyof typeof protocolLoaders];
  return protocol?.preload();
}
const ApiDebug = protocolLoaders.api.Component;
const SseDebug = protocolLoaders.sse.Component;
const Folder = protocolLoaders.folder.Component;
const WebSocketDebug = protocolLoaders.websocket.Component;
const SocketioDebug = protocolLoaders.socketio.Component;
const GraphqlDebug = protocolLoaders.graphql.Component;
if (window.vscodeData?.kind) {
  void preloadRequestProtocol(window.vscodeData.kind)?.catch(() => {});
}
import { APIS_TARGET_TYPE_ENUM } from "@onapi/http-model/requests/constants/index";
import { WebSocketDetailsData } from "@onapi/http-model/requests/types/websocket";
import { SocketIoDetailsData } from "@onapi/http-model/requests/types/socketio";
import { GraphQLDetailsData } from "@onapi/http-model/requests/types/graphql";

interface ContentProps {
  value?: ApiDetailsData;
  curApiSendingData?: any;
}

// Inside the Suspense boundary: runs after the selected protocol has committed.
function ContentReady() {
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
        window.vscode.postMessage({ action: "getApiList" });
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, []);
  return null;
}

const Content: React.FC<ContentProps> = () => {
  const apisActiveData: Partial<ApisData> = useApis(
    (store) => store.apisActiveData,
  );
  const updateApisActiveData = useApis((store) => store.updateApisActiveData);

  const onApisDataChange = (newData: ApisData) => {
    window?.vscode.postMessage({
      action: "updateApiActiveData",
      data: newData,
    });
    updateApisActiveData(newData);
  };

  const renderContainer = () => {
    if (apisActiveData.kind === "api") {
      return (
        <ApiDebug
          apisData={apisActiveData as ApiDetailsData}
          onApisDataChange={onApisDataChange}
        />
      );
    }
    if (apisActiveData.kind === "sse") {
      return (
        <SseDebug
          apisData={apisActiveData as ApiDetailsData}
          onApisDataChange={onApisDataChange}
        />
      );
    }
    if (apisActiveData.kind === APIS_TARGET_TYPE_ENUM.FOLDER) {
      return (
        <Folder
          apisData={apisActiveData as ApiDetailsData}
          onApisDataChange={onApisDataChange}
        />
      );
    }
    if (apisActiveData.kind === "websocket") {
      return (
        <WebSocketDebug
          apisData={apisActiveData as WebSocketDetailsData}
          onApisDataChange={(val) => {
            onApisDataChange(val as unknown as ApiDetailsData);
          }}
        />
      );
    }
    if (apisActiveData.kind === "socketio") {
      return (
        <SocketioDebug
          apisData={apisActiveData as SocketIoDetailsData}
          onApisDataChange={(val) => {
            onApisDataChange(val as unknown as ApiDetailsData);
          }}
        />
      );
    }
    if (apisActiveData.kind === "graphql") {
      return (
        <GraphqlDebug
          apisData={apisActiveData as GraphQLDetailsData}
          onApisDataChange={(val) => {
            onApisDataChange(val as unknown as ApiDetailsData);
          }}
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
          {apisActiveData.id && <ContentReady />}
        </Flex>
      }
    </>
  );
};

export default Content;
