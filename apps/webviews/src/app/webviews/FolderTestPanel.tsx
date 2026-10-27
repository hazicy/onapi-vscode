import { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { App as BaseApp, Skeleton } from "@/shared/ui/base";
import useGlobalTheme from "@/shared/theme";

import "@/shared/assets/css/reset.css";

import "@/shared/locale";
import Testing from "@/features/testing/components/Testing/Testing";
import { ThemeProvider } from "@/shared/ui/base/Theme";
import GlobalThemeStyle from "../../shared/theme/global";
import GlobalStyle from "../../shared/theme/globalStyle";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import useSystemConfig from "@/features/settings/store/useSystemConfig";
import { useGlobal } from "@/app/store";
import useTesting from "@/features/testing/store/useTesting";
import { produce } from "immer";
import { saveReport } from "@/features/testing/components/Testing/utils";
import { isString } from "lodash";

function FolderTestPanel() {
  const customTheme = useGlobalTheme();
  const updateTestingReportList = useTesting(
    (store) => store?.updateTestingReportList,
  );
  const updateTestingConfig = useTesting((store) => store?.updateTestingConfig);
  const updateProjectConfig = useProjectConfig(
    (state) => state.updateProjectConfig,
  );
  const updateEventList = useTesting((store) => store?.updateEventList);
  const testingSendingData = useTesting((store) => store?.testingSendingData);
  const updateTestingSendingData = useTesting(
    (store) => store?.updateTestingSendingData,
  );
  const updateTestingName = useTesting((store) => store?.updateTestingName);
  const updateShowReportList = useTesting(
    (store) => store?.updateShowReportList,
  );
  const testingName = useTesting((store) => store?.testingName);
  const updateVscodeTheme = useGlobal((store) => store.updateVscodeTheme);

  useEffect(() => {
    // First time get test data
    window?.vscode.postMessage({
      action: "getTestData",
    });

    window?.vscode.postMessage({
      action: "getProjectConfig",
    });

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
        case "setTestData":
          const {
            reportList,
            eventList,
            config,
            testingName,
            isInit,
            showReportList,
          } = message.data;

          // Set API event list
          eventList && updateEventList(eventList);
          // Set test configuration information
          config && updateTestingConfig(config);
          // Set report list
          reportList && updateTestingReportList(reportList);
          // Set test name
          testingName && updateTestingName(testingName || "Test Folder");

          // Initialize page
          if (isInit) {
            const newTestingSendingData = produce(
              testingSendingData,
              (draft: any) => {
                draft.requestList = [];
                draft.sendStatus = "initial";
                draft.complete = {};
              },
            );
            updateTestingSendingData(newTestingSendingData);
          }

          updateShowReportList(Boolean(showReportList));
          break;
        case "sendEventList":
          const result = message.data;
          if (result.action === "request") {
            const newTestingSendingData = produce(
              testingSendingData,
              (draft: any) => {
                draft.requestList.push(result.data);
              },
            );
            updateTestingSendingData(newTestingSendingData);
          }
          if (result.action === "complete") {
            const newTestingSendingData = produce(
              testingSendingData,
              (draft) => {
                draft.sendStatus = "sendOver";
                draft.complete = result.data;
              },
            );
            updateTestingSendingData(newTestingSendingData);

            // Save test report
            saveReport(result.data);
          }
          break;
        case "setProjectConfig":
          updateProjectConfig({ ...message.data });
          break;
        case "setSystemConfig":
          const { systemConfig, updateSystemConfig } =
            useSystemConfig.getState();

          updateSystemConfig({ ...systemConfig, ...message.data });
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
  }, [testingSendingData]);

  return (
    <BaseApp>
      <ThemeProvider theme={customTheme}>
        <GlobalThemeStyle />
        <GlobalStyle />
        <Skeleton
          active
          paragraph={{ rows: 15, width: "100%" }}
          loading={!isString(testingName) || !testingName}
        >
          <Testing />
        </Skeleton>
      </ThemeProvider>
    </BaseApp>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <FolderTestPanel />,
);
