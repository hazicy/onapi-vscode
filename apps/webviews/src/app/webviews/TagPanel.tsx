import { PROTOCOL_EXECUTION_EVENT } from "@onapi/contracts";
import { createExecutionConsumer } from "@/features/requests/execution/consume-event";
import { reduceHttpExecutionEvent } from "@/features/requests/execution/http-state";
import { Suspense, useEffect } from "react";
import { isEqual } from "lodash";
import ReactDOM from "react-dom/client";
import { App as BaseApp } from "@/shared/ui/base";
import useGlobalTheme from "@/shared/theme";
import ErrorBoundary from "@/shared/components/ErrorBoundary";
import "@/shared/assets/css/reset.css";
import "@/shared/locale";
import RequestWorkspace, {
  preloadRequestProtocol,
} from "@/features/requests/RequestWorkspace";
import { ThemeProvider } from "@/shared/ui/base/Theme";
import GlobalThemeStyle from "../../shared/theme/global";
import GlobalStyle from "../../shared/theme/globalStyle";
import useApis from "@/features/requests/store/useApis";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import useSystemConfig from "@/features/settings/store/useSystemConfig";
import { useGlobal } from "@/app/store";
import { HotkeysProvider } from "react-hotkeys-hook";
import useApisHotkeys from "@/features/requests/hooks/useApisHotkeys";
import useShare from "@/features/sharing/store/useShare";
import { ApiDetailsData } from "@onapi/http-model/requests/types/api";
import useWebSocket from "@/features/requests/protocols/websocket/useWebSocket";
import useSocketIo from "@/features/requests/protocols/socketio/useWebSocket";
import useGraphQLQuery from "@/features/requests/graphql/GraphQLQuery/useGraphQLQuery";

function initializeRequest(data: any) {
  const { apiData, projectConfig, systemConfig, vscodeTheme, docBaseUrl } =
    data;
  void preloadRequestProtocol(apiData.kind)?.catch(() => {});
  useProjectConfig.getState().updateProjectConfig(projectConfig);
  useSystemConfig.getState().updateSystemConfig({
    ...useSystemConfig.getState().systemConfig,
    ...systemConfig,
  });
  useGlobal.getState().updateVscodeTheme(vscodeTheme);
  useShare.getState().updateDocBaseUrl(docBaseUrl);
  useApis.getState().updateApisActiveData(apiData);
  performance.mark("onapi:data-ready");
}

// Hydrate before the first render so a local request needs no host round trip
// and never suspends on data that is already available in the HTML.
initializeRequest(window.vscodeData.initialData);

function TagPanel() {
  const customTheme = useGlobalTheme();

  const updateProjectConfig = useProjectConfig(
    (state) => state.updateProjectConfig,
  );
  const updateApisActiveData = useApis((store) => store.updateApisActiveData);
  const updateApiCodeHar = useApis((store) => store.updateApiCodeHar);
  const updateVscodeTheme = useGlobal((store) => store.updateVscodeTheme);
  const systemConfig = useSystemConfig((state) => state.systemConfig);
  const updateSystemConfig = useSystemConfig(
    (state) => state.updateSystemConfig,
  );
  const updateDocBaseUrl = useShare((state) => state.updateDocBaseUrl);
  const updateApiOriginDetailsList = useApis(
    (store) => store.updateApiOriginDetailsList,
  );

  useApisHotkeys();

  const { handelWsResult } = useWebSocket();

  const { handelSocketIoResult, handleProxyFetchResult } = useSocketIo();

  const { handelGraphQLSchemaFetchResult } = useGraphQLQuery();

  useEffect(() => {
    performance.mark("onapi:react-mounted");
    if (performance.getEntriesByName("onapi:html-ready").length) {
      performance.measure(
        "onapi:html-to-react",
        "onapi:html-ready",
        "onapi:react-mounted",
      );
    }
    const consumeExecutionEvent = createExecutionConsumer();
    const messageHandler = async (event: { data: any }) => {
      const message = event.data; // The JSON data our extension sent

      switch (message.action) {
        case "externalStorageChanged": {
          const state = useApis.getState();
          const active = state.apisActiveData;
          const previous = state.apiOriginDetailsList.find(
            (item) => item.id === active.id,
          );
          const current = (message.data as ApiDetailsData[]).find(
            (item) => item.id === active.id,
          );
          // Preserve edits when the file changes underneath an open editor.
          if (current && (!previous || isEqual(active, previous))) {
            updateApisActiveData({ ...current });
          }
          updateApiOriginDetailsList(message.data || []);
          break;
        }
        case "setApiList":
          updateApiOriginDetailsList(message?.data || []);
          break;
        case PROTOCOL_EXECUTION_EVENT:
          consumeExecutionEvent(message.data, {
            http: (event) => {
              const state = useApis.getState();
              const next = reduceHttpExecutionEvent(
                state.currentSendingData,
                event,
              );
              state.updateCurrentSendingData(next);
            },
            websocket: handelWsResult,
            socketio: handelSocketIoResult,
          });
          break;
        case "setProjectConfig":
          updateProjectConfig({ ...message.data });
          break;
        case "requestSaved":
          useApis
            .getState()
            .acknowledgeSave(message.data.definition, message.data.submitted);
          break;
        case "setApiData":
          void preloadRequestProtocol(message.data.kind)?.catch(() => {});
          updateApisActiveData({ ...message.data });

          break;
        case "setVscodeTheme":
          updateVscodeTheme(message.data);
          break;
        case "setSystemConfig":
          updateSystemConfig({ ...systemConfig, ...message.data });
          break;
        case "setDocBaseUrl":
          updateDocBaseUrl(message.data);
          break;
        case "setCodeHar":
          updateApiCodeHar(message.data);
          break;
        case "proxyFetchResult":
          handleProxyFetchResult(message.data);
          break;
        case "graphQLSchemaFetchResult":
          handelGraphQLSchemaFetchResult(message.data);
          break;
      }
    };
    window.addEventListener("message", messageHandler);
    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, []);

  return (
    <BaseApp>
      <ThemeProvider theme={customTheme}>
        <GlobalThemeStyle />
        <GlobalStyle />
        <ErrorBoundary>
          <Suspense fallback={null}>
            <RequestWorkspace />
          </Suspense>
        </ErrorBoundary>
      </ThemeProvider>
    </BaseApp>
  );
}

const rootElement = document.getElementById("root")!;
// Keep the startup background while fetching, without committing a Suspense
// fallback. Otherwise React's retry lane can postpone ready content by 300ms.
const root = ReactDOM.createRoot(rootElement);
const mount = () =>
  root.render(
    <HotkeysProvider initiallyActiveScopes={["global", "apis"]}>
      <TagPanel />
    </HotkeysProvider>,
  );
Promise.resolve(
  preloadRequestProtocol(window.vscodeData.initialData.apiData.kind),
).then(mount, mount); // Failed loads still render through the ErrorBoundary.
