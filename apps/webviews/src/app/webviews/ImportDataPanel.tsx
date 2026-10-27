import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { App as BaseApp, Skeleton } from "@/shared/ui/base";
import useGlobalTheme from "@/shared/theme";

import "@/shared/assets/css/reset.css";

import "@/shared/locale";
import ImportData from "@/features/import/components/ImportData";
import { ThemeProvider } from "@/shared/ui/base/Theme";
import GlobalThemeStyle from "../../shared/theme/global";
import GlobalStyle from "../../shared/theme/globalStyle";
import useApis from "@/features/requests/store/useApis";
import useSystemConfig from "@/features/settings/store/useSystemConfig";
import useUserConfig from "@/features/auth/store/useUserConfig";
import { useGlobal } from "@/app/store";

import { isArray } from "lodash";
import useImportData from "@/features/import/store/useImportData";

function ImportDataPanel() {
  const customTheme = useGlobalTheme();
  const updateUserConfig = useUserConfig((store) => store.updateUserConfig);
  const updateApiOriginDetailsList = useApis(
    (store) => store.updateApiOriginDetailsList,
  );
  const updateVscodeTheme = useGlobal((store) => store.updateVscodeTheme);
  const {
    updatePreview: setPreview,
    updatePreviewLoading: setPreviewLoading,
    updatePreviewData: setPreviewData,
    updatePreviewSelectData: setPreviewSelectData,
  } = useImportData((store) => store);
  const [lodaing, setLodaing] = useState(true);
  useEffect(() => {
    window?.vscode.postMessage({
      action: "getApiList",
    });

    // Get global configuration
    window?.vscode.postMessage({
      action: "getSystemConfig",
    });

    window?.vscode.postMessage({
      action: "getVscodeTheme",
    });

    // Get user information
    window?.vscode.postMessage({
      action: "getUserConfig",
    });
  }, []);

  useEffect(() => {
    const messageHandler = async (event: { data: any }) => {
      const message = event.data; // The JSON data our extension sent

      switch (message.action) {
        case "setUserConfig":
          updateUserConfig({ ...message.data });
          setLodaing(false);
          break;
        case "setApiList":
          if (isArray(message.data)) {
            updateApiOriginDetailsList(message.data);
          }
          setLodaing(false);
          break;
        case "setSystemConfig":
          const { systemConfig, updateSystemConfig } =
            useSystemConfig.getState();

          updateSystemConfig({ ...systemConfig, ...message.data });
          break;
        case "setVscodeTheme":
          updateVscodeTheme(message.data);
          break;
        case "setImportData":
          setPreviewData(message.data);

          if (message.type === "select_envs") {
            setPreviewSelectData({
              apis: [],
              models: [],
              envs: (message.data?.envs || []).map((i: any) => i?.env_id),
            });
          } else {
            setPreviewSelectData({
              apis: (message.data?.apis || []).map((i: any) => i?.id),
              models: (message.data?.models || []).map((i: any) => i?.model_id),
              envs: [],
            });
          }

          setPreview(true);

          setPreviewLoading(false);
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
        <Skeleton
          active
          paragraph={{ rows: 15, width: "100%" }}
          loading={lodaing}
        >
          <ImportData />
        </Skeleton>
      </ThemeProvider>
    </BaseApp>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ImportDataPanel />,
);
