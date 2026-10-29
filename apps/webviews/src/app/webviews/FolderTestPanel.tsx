import SharedComponentsProvider from "@/app/providers/SharedComponentsProvider";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { App as BaseApp, Skeleton } from "@/shared/ui/base";
import useGlobalTheme from "@/features/settings/hooks/useGlobalTheme";

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
  const updateTestingSendingData = useTesting(
    (store) => store?.updateTestingSendingData,
  );
  const updateTestingName = useTesting((store) => store?.updateTestingName);
  const updateShowReportList = useTesting(
    (store) => store?.updateShowReportList,
  );
  const [loaded, setLoaded] = useState(false);
  const updateVscodeTheme = useGlobal((store) => store.updateVscodeTheme);

  useEffect(() => {
    const messageHandler = async (event: { data: any }) => {
      const message = event.data; // The JSON data our extension sent
      const { testingSendingData } = useTesting.getState();

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
          updateTestingName(testingName || "Test Folder");
          setLoaded(true);

          // Initialize page
          if (isInit) {
            const newTestingSendingData = produce(
              testingSendingData,
              (draft: any) => {
                draft.events = [];
                draft.sendStatus = "initial";
                delete draft.startedAt;
                delete draft.finishedAt;
              },
            );
            updateTestingSendingData(newTestingSendingData);
          }

          updateShowReportList(Boolean(showReportList));
          break;
        case "folderTestStarted":
          updateTestingSendingData({
            ...testingSendingData,
            environmentName: message.data.environmentName,
          });
          break;
        case "folderTestEvent": {
          if (testingSendingData.sendStatus !== "sending") {
            break;
          }
          const done = message.data.type === "done";
          updateTestingSendingData({
            ...testingSendingData,
            events: [...testingSendingData.events, message.data],
            sendStatus: done ? "sendOver" : "sending",
            ...(done ? { finishedAt: Date.now() } : {}),
          });
          if (done) {
            saveReport();
          }
          break;
        }
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
  }, []);

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

  return (
    <SharedComponentsProvider>
      <BaseApp>
        <ThemeProvider theme={customTheme}>
          <GlobalThemeStyle />
          <GlobalStyle />
          <Skeleton active paragraph={{ rows: 15 }} loading={!loaded}>
            <Testing />
          </Skeleton>
        </ThemeProvider>
      </BaseApp>
    </SharedComponentsProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <FolderTestPanel />,
);
