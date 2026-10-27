import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { App as BaseApp, Skeleton } from "@/shared/ui/base";
import useGlobalTheme from "@/shared/theme";
import ErrorBoundary from "@/shared/components/ErrorBoundary";

import "@/shared/assets/css/reset.css";

import "@/shared/locale";
import Environment from "@/features/environment/components";
import { ThemeProvider } from "@/shared/ui/base/Theme";
import GlobalThemeStyle from "../../shared/theme/global";
import GlobalStyle from "../../shared/theme/globalStyle";
import useSystemConfig from "@/features/settings/store/useSystemConfig";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import { useGlobal } from "@/app/store";
import useEnv from "@/features/environment/hooks/useEnv";

function EnvironmentPanel() {
  const customTheme = useGlobalTheme();

  const systemConfig = useSystemConfig((state) => state.systemConfig);
  const updateSystemConfig = useSystemConfig(
    (state) => state.updateSystemConfig,
  );
  const updateProjectConfig = useProjectConfig(
    (state) => state.updateProjectConfig,
  );
  const updateVscodeTheme = useGlobal((store) => store.updateVscodeTheme);
  const updateEstablish = useProjectConfig((state) => state.updateEstablish);
  const updateEnvSettingKeys = useProjectConfig(
    (state) => state.updateEnvSettingKeys,
  );

  const [lodaing, setLodaing] = useState(true);
  const [environmentKey, setEnvironmentKey] = useState(1);
  const { handleProxyFetchResult } = useEnv();

  useEffect(() => {
    // Get project information
    window?.vscode.postMessage({
      action: "getProjectConfig",
    });

    window?.vscode.postMessage({
      action: "getSystemConfig",
    });

    window?.vscode.postMessage({
      action: "getVscodeTheme",
    });
  }, []);

  useEffect(() => {
    const messageHandler = async (event: { data: any }) => {
      const message = event.data; // The JSON data our extension sent

      switch (message.action) {
        case "setProjectConfig":
          updateProjectConfig({ ...message.data });
          setLodaing(false);
          break;
        case "setSystemConfig":
          updateSystemConfig({ ...systemConfig, ...message.data });
          break;
        case "setVscodeTheme":
          updateVscodeTheme(message.data);
          break;
        case "initCreateEnv":
          updateEstablish(true);
          break;
        case "setEnvSettingKeys":
          updateEnvSettingKeys(message.data);
          setEnvironmentKey((lastState) => {
            return lastState ? 0 : 1;
          });
          break;
        case "proxyFetchResult":
          handleProxyFetchResult(message.data);
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
          <Skeleton
            active
            paragraph={{ rows: 15, width: "100%" }}
            loading={lodaing}
          >
            <Environment key={environmentKey} open={true} />
          </Skeleton>
        </ErrorBoundary>
      </ThemeProvider>
    </BaseApp>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <EnvironmentPanel />,
);
