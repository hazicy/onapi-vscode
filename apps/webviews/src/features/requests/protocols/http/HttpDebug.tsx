import styles from "./HttpDebug.module.css";
import { FC, lazy, useMemo, useState } from "react";
import { useSafeState } from "ahooks";
import { Dropdown, Flex } from "@/shared/ui/base";
import AppIcon from "@/shared/ui/AppIcon";
import { produce } from "immer";
import { DirectionType } from "@onapi/domain/types/common";
import ResizablePanels from "@/shared/components/ResizablePanels/ResizablePanels";
import SuspenseContent from "@/shared/components/SuspenseContent";

import useApis from "@/features/requests/store/useApis";
import Request from "@/features/requests/editor/Request/Request";
import Response from "./Response";
import Header from "./Header";
import ToolBar from "./ToolBar";
import { useTranslation } from "react-i18next";
import {
  ApiComponentType,
  ApiDetailsData,
} from "@onapi/domain/requests/types/api";
import { Button } from "@/shared/ui";
import context from "@/shared/components/RawEditor/visualizationContext";
import { openEnvPage } from "@/features/requests/events/env";
const GenerateCodeDrawer = lazy(
  () => import("@/features/requests/code-generation/GenerateCodeDrawer"),
);

interface ContentProps {
  value?: ApiDetailsData;
  curApiSendingData?: any;
}

const panelProps = {
  defaultSize: 50,
  minSize: 5,
  collapsible: true,
  collapsedSize: 5,
};

const ApiDebug: FC<ApiComponentType> = ({ apisData, onApisDataChange }) => {
  const { t } = useTranslation();
  const [apiScreenDirection, setApiScreenDirection] =
    useSafeState<DirectionType>("horizontal");
  const updateApiCodeHar = useApis((store) => store.updateApiCodeHar);
  const [openGenerateCode, setOpenGenerateCode] = useState<boolean>(false);

  const [requestTabActiveKey, setRequestTabActiveKey] =
    useState<string>("Params");
  const { Provider } = context;
  const handleDirectionChange = (direction: DirectionType) => {
    // setApiScreenDirection(direction);
  };

  const onRequestDataChange = (val: ApiDetailsData["request"]) => {
    onApisDataChange(
      produce(apisData as ApiDetailsData, (draft) => {
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
        apisData={apisData as ApiDetailsData}
        onApisDataChange={onApisDataChange}
      />
      <header>
        <Header
          apisData={apisData as ApiDetailsData}
          onApisDataChange={onApisDataChange}
        />
      </header>
      <main>
        <ResizablePanels
          showDirectionBtn
          panelGroupProps={{
            autoSaveId: "api_debug_container_resize_save_id",
            direction: apiScreenDirection,
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
                    direction={apiScreenDirection}
                    requestData={(apisData as ApiDetailsData)?.request}
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
                apisData={apisData as ApiDetailsData}
                onApisDataChange={onApisDataChange}
              />
            </SuspenseContent>
          }
          onDirectionChange={handleDirectionChange}
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
