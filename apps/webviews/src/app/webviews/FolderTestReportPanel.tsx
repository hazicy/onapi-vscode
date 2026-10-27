import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { App as BaseApp, Spin } from "@/shared/ui/base";
import useGlobalTheme from "@/shared/theme";

import "@/shared/assets/css/reset.css";

import "@/shared/locale";
import ReportDetails from "@/features/testing/components/Testing/ReportDetails";
import { ThemeProvider } from "@/shared/ui/base/Theme";
import GlobalThemeStyle from "../../shared/theme/global";
import GlobalStyle from "../../shared/theme/globalStyle";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import useSystemConfig from "@/features/settings/store/useSystemConfig";
import useTesting from "@/features/testing/store/useTesting";
import { TestingReportList } from "@onapi/http-model/testing/types/res/index";
import { useTranslation } from "react-i18next";

function FolderTestPanel() {
  const customTheme = useGlobalTheme();
  const { t } = useTranslation();

  const updateProjectConfig = useProjectConfig(
    (state) => state.updateProjectConfig,
  );
  const testingSendingData = useTesting((store) => store?.testingSendingData);

  const [reportDetails, setReportDetails] = useState<TestingReportList>();

  useEffect(() => {
    // First time get test data
    window?.vscode.postMessage({
      action: "getReportDetails",
    });

    // Get global configuration
    window?.vscode.postMessage({
      action: "getSystemConfig",
    });

    window?.vscode.postMessage({
      action: "getProjectConfig",
    });
  }, []);

  useEffect(() => {
    const messageHandler = async (event: { data: any }) => {
      const message = event.data; // The JSON data our extension sent

      switch (message.action) {
        case "setProjectConfig":
          updateProjectConfig({ ...message.data });
          break;
        case "setReportDetails":
          setReportDetails(message.data);
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
  }, [testingSendingData]);

  return (
    <BaseApp>
      <ThemeProvider theme={customTheme}>
        <GlobalThemeStyle />
        <GlobalStyle />
        <Spin tip={t("common.loading")} spinning={!Boolean(reportDetails)}>
          {reportDetails && <ReportDetails reportDetails={reportDetails} />}
        </Spin>
      </ThemeProvider>
    </BaseApp>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <FolderTestPanel />,
);
