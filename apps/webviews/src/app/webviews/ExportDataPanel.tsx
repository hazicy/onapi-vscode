import SharedComponentsProvider from "@/app/providers/SharedComponentsProvider";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { App as BaseApp, Skeleton } from "@/shared/ui/base";
import useGlobalTheme from "@/features/settings/hooks/useGlobalTheme";

import "@/shared/assets/css/reset.css";

import "@/shared/locale";
import ExportData from "@/features/export/components/ExportData";
import { ThemeProvider } from "@/shared/ui/base/Theme";
import GlobalThemeStyle from "../../shared/theme/global";
import GlobalStyle from "../../shared/theme/globalStyle";
import useSystemConfig from "@/features/settings/store/useSystemConfig";
import { useGlobal } from "@/app/store";

function ExportDataPanel() {
  const customTheme = useGlobalTheme();
  const updateVscodeTheme = useGlobal((store) => store.updateVscodeTheme);

  const [lodaing, setLodaing] = useState(true);
  useEffect(() => {
    // window?.vscode.postMessage({
    //   action: 'getApiList',
    // });

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
        case "setSystemConfig":
          const { systemConfig, updateSystemConfig } =
            useSystemConfig.getState();

          updateSystemConfig({ ...systemConfig, ...message.data });

          setLodaing(false);
          break;
        case "setVscodeTheme":
          updateVscodeTheme(message.data);
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
          <Skeleton active paragraph={{ rows: 15 }} loading={lodaing}>
            <ExportData />
          </Skeleton>
        </ThemeProvider>
      </BaseApp>
    </SharedComponentsProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ExportDataPanel />,
);
