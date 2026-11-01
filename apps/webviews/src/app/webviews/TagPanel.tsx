import useSocketConnectionsStore from "@/features/requests/store/useSocketConnectionsStore";
import { editorRecordSchema } from "@onapi/domain/requests/record";
import { readRequestPanelResponse } from "@/shared/bridge/request-panel";
import SharedComponentsProvider from "@/app/providers/SharedComponentsProvider";
import { PROTOCOL_EXECUTION_EVENT } from "@onapi/contracts";
import { consumeExecutionEvent } from "@/features/requests/execution/consume-event";
import { reduceHttpExecutionEvent } from "@/features/requests/protocols/http/http-state";
import { Suspense, useEffect } from "react";
import { isEqual } from "lodash-es";
import ReactDOM from "react-dom/client";
import { App as BaseApp } from "@/shared/ui/base";
import useGlobalTheme from "@/features/settings/hooks/useGlobalTheme";
import ErrorBoundary from "@/shared/components/ErrorBoundary";
import "@/shared/assets/css/reset.css";
import "@/shared/locale";
import RequestWorkspace, {
  preloadRequestProtocol,
} from "@/features/requests/RequestWorkspace";
import { ThemeProvider } from "@/shared/ui/base/Theme";
import GlobalThemeStyle from "../../shared/theme/global";
import "../../shared/theme/globalStyle.css";
import useRequestWorkspaceStore from "@/features/requests/store/useRequestWorkspaceStore";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import useSystemConfig from "@/features/settings/store/useSystemConfig";
import { useGlobal } from "@/app/store";
import { HotkeysProvider } from "react-hotkeys-hook";
import useRequestHotkeys from "@/features/requests/hooks/useRequestHotkeys";
import useShare from "@/features/sharing/store/useShare";

import { useRequestOAuth2Result } from "@/features/requests/editor/Request/Auth/useRequestOAuth2Result";
import useGraphQLSchema from "@/features/requests/protocols/graphql/schema/useGraphQLSchema";

function initializeRequest(data: any) {
  const { apiData, projectConfig, systemConfig, vscodeTheme, docBaseUrl } =
    data;
  const record = editorRecordSchema.parse(apiData);
  void preloadRequestProtocol(record.kind)?.catch(() => {});
  useProjectConfig.getState().updateProjectConfig(projectConfig);
  useSystemConfig.getState().updateSystemConfig({
    ...useSystemConfig.getState().systemConfig,
    ...systemConfig,
  });
  useGlobal.getState().updateVscodeTheme(vscodeTheme);
  useShare.getState().updateDocBaseUrl(docBaseUrl);
  useRequestWorkspaceStore.getState().setActiveRequest(record);
  performance.mark("onapi:data-ready");
}

// Hydrate before the first render so a local request needs no host round trip
// and never suspends on data that is already available in the HTML.
let initializationError: string | undefined;
try {
  initializeRequest(window.vscodeData.initialData);
} catch {
  initializationError =
    "Unable to open request: invalid request data. Please check the saved request.";
}

function TagPanel() {
  const customTheme = useGlobalTheme();

  const updateProjectConfig = useProjectConfig(
    (state) => state.updateProjectConfig,
  );
  const setActiveRequest = useRequestWorkspaceStore(
    (store) => store.setActiveRequest,
  );
  const setRequestHar = useRequestWorkspaceStore(
    (store) => store.setRequestHar,
  );
  const updateVscodeTheme = useGlobal((store) => store.updateVscodeTheme);
  const systemConfig = useSystemConfig((state) => state.systemConfig);
  const updateSystemConfig = useSystemConfig(
    (state) => state.updateSystemConfig,
  );
  const updateDocBaseUrl = useShare((state) => state.updateDocBaseUrl);
  const setSavedRequests = useRequestWorkspaceStore(
    (store) => store.setSavedRequests,
  );

  useRequestHotkeys();

  const { handleProxyFetchResult } = useRequestOAuth2Result();

  const { handleGraphQLSchemaFetchResult } = useGraphQLSchema();

  useEffect(() => {
    performance.mark("onapi:react-mounted");
    if (performance.getEntriesByName("onapi:html-ready").length) {
      performance.measure(
        "onapi:html-to-react",
        "onapi:html-ready",
        "onapi:react-mounted",
      );
    }
    const messageHandler = async (event: { data: any }) => {
      const message = readRequestPanelResponse(event.data);
      if (!message) {
        return;
      }

      switch (message.action) {
        case "externalStorageChanged": {
          const state = useRequestWorkspaceStore.getState();
          const active = state.activeRequest;
          const previous = state.savedRequests.find(
            (item) => item.id === active.id,
          );
          const current = message.data.find((item) => item.id === active.id);
          // Preserve edits when the file changes underneath an open editor.
          if (current && (!previous || isEqual(active, previous))) {
            setActiveRequest({ ...current });
          }
          setSavedRequests(message.data);
          break;
        }
        case "setApiList":
          setSavedRequests(message.data);
          break;
        case PROTOCOL_EXECUTION_EVENT:
          consumeExecutionEvent(message.data, {
            http: (event, executionId, sequence) => {
              const state = useRequestWorkspaceStore.getState();
              state.setHttpExecution(
                reduceHttpExecutionEvent(state.httpExecution, {
                  type: "event",
                  executionId,
                  sequence,
                  event,
                }),
              );
            },
            websocket:
              useSocketConnectionsStore.getState().consumeExecutionEvent,
            socketio:
              useSocketConnectionsStore.getState().consumeExecutionEvent,
          });
          break;
        case "setProjectConfig":
          updateProjectConfig({ ...message.data });
          break;
        case "requestPanelError": {
          const failure = message.data;
          if (failure.action === "sendApi" && failure.executionId) {
            const state = useRequestWorkspaceStore.getState();
            state.setHttpExecution(
              reduceHttpExecutionEvent(state.httpExecution, {
                type: "failure",
                executionId: failure.executionId,
                error: failure.error,
              }),
            );
          }
          if (
            (failure.action === "ws_connect" ||
              failure.action === "socketio_connect") &&
            failure.targetId &&
            message.requestId
          ) {
            useSocketConnectionsStore
              .getState()
              .failConnection(
                failure.targetId,
                message.requestId,
                failure.error,
              );
          }
          if (failure.action === "getGraphQLSchema") {
            useRequestWorkspaceStore.getState().setSchemaLoading(false);
          }
          if (failure.action === "/proxy/fetch") {
            handleProxyFetchResult({ code: 500, error: failure.error.message });
          }
          // Save failures never acknowledge or replace the current draft.
          break;
        }
        case "requestSaved":
          useRequestWorkspaceStore
            .getState()
            .acknowledgeSave(message.data.definition, message.data.submitted);
          break;
        case "setApiData":
          void preloadRequestProtocol(message.data.kind)?.catch(() => {});
          setActiveRequest(message.data);

          break;
        case "setVscodeTheme":
          updateVscodeTheme(message.data || "");
          break;
        case "setSystemConfig":
          updateSystemConfig({ ...systemConfig, ...message.data });
          break;
        case "setDocBaseUrl":
          updateDocBaseUrl(message.data);
          break;
        case "setCodeHar":
          setRequestHar(message.data);
          break;
        case "proxyFetchResult":
          handleProxyFetchResult(message.data);
          break;
        case "graphQLSchemaFetchResult":
          handleGraphQLSchemaFetchResult({
            ...message.data,
            data: message.data.data as Parameters<
              typeof handleGraphQLSchemaFetchResult
            >[0]["data"],
            error:
              typeof message.data.error === "string"
                ? message.data.error
                : undefined,
          });
          break;
      }
    };
    window.addEventListener("message", messageHandler);
    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, []);

  return (
    <SharedComponentsProvider>
      <BaseApp>
        <ThemeProvider theme={customTheme}>
          <GlobalThemeStyle />
          <ErrorBoundary>
            <Suspense fallback={null}>
              <RequestWorkspace />
            </Suspense>
          </ErrorBoundary>
        </ThemeProvider>
      </BaseApp>
    </SharedComponentsProvider>
  );
}

const rootElement = document.getElementById("root")!;
// Keep the startup background while fetching, without committing a Suspense
// fallback. Otherwise React's retry lane can postpone ready content by 300ms.
const root = ReactDOM.createRoot(rootElement);
const mount = () =>
  root.render(
    <HotkeysProvider initiallyActiveScopes={["global", "apis"]}>
      {initializationError ? (
        <div role="alert">{initializationError}</div>
      ) : (
        <TagPanel />
      )}
    </HotkeysProvider>,
  );
Promise.resolve(
  initializationError
    ? undefined
    : preloadRequestProtocol(window.vscodeData.initialData.apiData.kind),
).then(mount, mount); // Failed loads still render through the ErrorBoundary.
