import SharedComponentsProvider from "@/app/providers/SharedComponentsProvider";
import { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { App as BaseApp } from "@/shared/ui/base";
import useGlobalTheme from "@/shared/theme";

import "@/shared/assets/css/reset.css";

import "@/shared/locale";
import Curl from "@/features/curl/components/Curl";
import { ThemeProvider } from "@/shared/ui/base/Theme";
import GlobalThemeStyle from "../../shared/theme/global";
import GlobalStyle from "../../shared/theme/globalStyle";
import useSystemConfig from "@/features/settings/store/useSystemConfig";
import { useGlobal } from "@/app/store";

function CurlPanel() {
  const customTheme = useGlobalTheme();
  const updateVscodeTheme = useGlobal((store) => store.updateVscodeTheme);

  useEffect(() => {
    // Get global configuration
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
        case "setApiList":
          break;
        case "setVscodeTheme":
          updateVscodeTheme(message.data);
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
        <ThemeProvider theme={customTheme}>
          <GlobalThemeStyle />
          <GlobalStyle />
          <Curl />
        </ThemeProvider>
      </BaseApp>
    </SharedComponentsProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<CurlPanel />);
