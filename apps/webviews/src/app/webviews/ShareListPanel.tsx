import SharedComponentsProvider from "@/app/providers/SharedComponentsProvider";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { App as BaseApp, Skeleton } from "@/shared/ui/base";
import useGlobalTheme from "@/features/settings/hooks/useGlobalTheme";
import ErrorBoundary from "@/shared/components/ErrorBoundary";

import "@/shared/assets/css/reset.css";

import "@/shared/locale";
import ShareList from "@/features/sharing/components/ShareList/ShareList";
import { ThemeProvider } from "@/shared/ui/base/Theme";
import GlobalThemeStyle from "../../shared/theme/global";
import GlobalStyle from "../../shared/theme/globalStyle";

import { HotkeysProvider } from "react-hotkeys-hook";
import useShare from "@/features/sharing/store/useShare";
import useApis from "@/features/requests/store/useApis";
import useSystemConfig from "@/features/settings/store/useSystemConfig";

function ShareListPanel() {
  const customTheme = useGlobalTheme();

  const updateShareData = useShare((state) => state.updateShareData);
  const updateApiOriginDetailsList = useApis(
    (store) => store.updateApiOriginDetailsList,
  );
  const updateDocBaseUrl = useShare((state) => state.updateDocBaseUrl);

  const [lodaing, setLodaing] = useState(true);

  useEffect(() => {
    // Initialize and pass API list
    window?.vscode.postMessage({
      action: "getApiList",
    });

    // Get share information
    window?.vscode.postMessage({
      action: "getShareData",
    });

    // Get doc base URL
    window?.vscode.postMessage({
      action: "getDocBaseUrl",
    });

    // Get global configuration
    window?.vscode.postMessage({
      action: "getSystemConfig",
    });
  }, []);

  useEffect(() => {
    const messageHandler = async (event: { data: any }) => {
      const message = event.data; // The JSON data our extension sent

      switch (message.action) {
        case "setApiList":
          updateApiOriginDetailsList(message?.data || []);
          setLodaing(false);
          break;
        case "setShareData":
          updateShareData({ ...message.data });
          break;
        case "setDocBaseUrl":
          updateDocBaseUrl(message.data);
          break;
        case "setSystemConfig":
          const { systemConfig, updateSystemConfig } =
            useSystemConfig.getState();

          updateSystemConfig({ ...systemConfig, ...message.data });
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
        <HotkeysProvider initiallyActiveScopes={["global"]}>
          <ThemeProvider theme={customTheme}>
            <GlobalThemeStyle />
            <GlobalStyle />
            <ErrorBoundary>
              <Skeleton active paragraph={{ rows: 15 }} loading={lodaing}>
                <ShareList />
              </Skeleton>
            </ErrorBoundary>
          </ThemeProvider>
        </HotkeysProvider>
      </BaseApp>
    </SharedComponentsProvider>
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <ShareListPanel />,
);
