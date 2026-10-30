import type {
  HttpEditorProps,
  HttpEditorRecord,
} from "@onapi/domain/requests/record";
import styles from "./HttpDebug.module.css";
import { FC, lazy, useMemo, useState } from "react";
import { Dropdown, Flex } from "@/shared/ui/base";
import AppIcon from "@/shared/ui/AppIcon";
import { produce } from "immer";
import ResizablePanels from "@/shared/components/ResizablePanels/ResizablePanels";
import SuspenseContent from "@/shared/components/SuspenseContent";

import useApis from "@/features/requests/store/useApis";
import Request from "@/features/requests/editor/Request/Request";
import Response from "./Response";
import Header from "./Header";
import ToolBar from "./ToolBar";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui";
import context from "@/shared/components/RawEditor/visualizationContext";
import { openEnvPage } from "@/features/requests/events/env";
const GenerateCodeDrawer = lazy(
  () => import("@/features/requests/code-generation/GenerateCodeDrawer"),
);

const panelProps = {
  defaultSize: 50,
  minSize: 5,
  collapsible: true,
  collapsedSize: 5,
};

const ApiDebug: FC<HttpEditorProps> = ({ apisData, onApisDataChange }) => {
  const { t } = useTranslation();
  const updateApiCodeHar = useApis((store) => store.updateApiCodeHar);
  const [openGenerateCode, setOpenGenerateCode] = useState<boolean>(false);

  const [requestTabActiveKey, setRequestTabActiveKey] =
    useState<string>("Params");
  const { Provider } = context;
  const onRequestDataChange = (val: HttpEditorRecord["request"]) => {
    onApisDataChange(
      produce(apisData, (draft) => {
        draft.request = val;
      }),
    );
  };

  const handleToCode = () => {
    updateApiCodeHar({});
    setOpenGenerateCode(true);
  };

  const handleToGlobalParams = () => {
    openEnvPage({
      global_param: "global_param",
      global_param_tab_key: requestTabActiveKey,
    });
  };

  const tabBarExtraContent = useMemo(() => {
    return (
      <Flex align="center" className={styles.actions}>
        <div className={styles.primaryActions}>
          <Button
            onClick={handleToCode}
            type="text"
            mode="light"
            size="small"
            style={{ padding: "4px 6px" }}
            className={styles.textBtnHighlight}
          >
            {t("system_settings.shortcuts.apis_detail.code")}
          </Button>
          <Button
            onClick={handleToGlobalParams}
            type="text"
            mode="light"
            size="small"
            style={{ padding: "4px 6px" }}
            className={styles.textBtnHighlight}
          >
            {t("global_setting.global_title")}{" "}
            {requestTabActiveKey === "Path" ? "Para" : requestTabActiveKey}
          </Button>
        </div>
        <div className={styles.compactActions}>
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                {
                  key: "code",
                  label: t("system_settings.shortcuts.apis_detail.code"),
                  onClick: handleToCode,
                },
                {
                  key: "global",
                  label: `${t("global_setting.global_title")} ${requestTabActiveKey === "Path" ? "Para" : requestTabActiveKey}`,
                  onClick: handleToGlobalParams,
                },
              ],
            }}
          >
            <button
              type="button"
              className={styles.moreButton}
              aria-label={t("request_panel.more")}
              title={t("request_panel.more")}
            >
              <AppIcon icon="ellipsis" />
            </button>
          </Dropdown>
        </div>
      </Flex>
    );
  }, [requestTabActiveKey]);

  return (
    <>
      <ToolBar
        showLayoutControl
        apisData={apisData}
        onApisDataChange={onApisDataChange}
      />
      <header>
        <Header apisData={apisData} onApisDataChange={onApisDataChange} />
      </header>
      <main>
        <ResizablePanels
          showDirectionBtn
          panelGroupProps={{
            autoSaveId: "api_debug_container_resize_save_id",
            direction: "horizontal",
          }}
          leftPanelProps={{
            ...panelProps,
            collapseTitle: t("supplement.request_panel"),
          }}
          rightPanelProps={{
            ...panelProps,
            collapseTitle: t("supplement.response_panel"),
          }}
          leftPanel={
            <SuspenseContent>
              <Provider
                value={{
                  isDebugArea: true,
                }}
              >
                <div className={styles.container}>
                  <Request
                    onItemChange={onApisDataChange}
                    tabOptions={{
                      activeKey: requestTabActiveKey,
                      onChange: (key: string) => setRequestTabActiveKey(key),
                    }}
                    direction="horizontal"
                    requestData={apisData?.request}
                    apiData={apisData}
                    onRequestDataChange={onRequestDataChange}
                    tabBarExtraContent={tabBarExtraContent}
                    id={apisData?.id}
                  />
                </div>
              </Provider>
            </SuspenseContent>
          }
          rightPanel={
            <SuspenseContent>
              <Response
                apisData={apisData}
                onApisDataChange={onApisDataChange}
              />
            </SuspenseContent>
          }
        />
      </main>
      {openGenerateCode && (
        <SuspenseContent>
          <GenerateCodeDrawer
            value={apisData}
            onClose={() => setOpenGenerateCode(false)}
          />
        </SuspenseContent>
      )}
    </>
  );
};

export default ApiDebug;
