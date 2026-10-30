import type { HttpEditorProps } from "@onapi/domain/requests/record";
import styles from "./GraphQLDebug.module.css";
import { FC, lazy, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ResizablePanels, SuspenseContent } from "@/shared/components";

import ResponseRealtimeContext from "@/features/requests/response/Response/components/Realtime/context";
import GraphQLResponseContext from "@/features/requests/graphql/graphql-response-context";
import { DirectionContext } from "@/shared/contexts";

import { DirectionType } from "@onapi/domain/types/common";
import { importDelay } from "@/shared/utils/common";

import UrlPanel from "./UrlPanel";

import ToolBar from "../http/ToolBar";

import { Flex } from "@/shared/ui/base";
import { Button } from "@/shared/ui";
import useApis from "@/features/requests/store/useApis";
const GenerateCodeDrawer = lazy(
  () => import("@/features/requests/code-generation/GenerateCodeDrawer"),
);
const Request = lazy(() => importDelay(import("./Request")));
const Response = lazy(() => importDelay(import("./Response")));

const panelProps = {
  defaultSize: 50,
  minSize: 5,
  collapsible: true,
  collapsedSize: 5,
};

const Index: FC<HttpEditorProps> = ({ apisData, onApisDataChange }) => {
  const { t } = useTranslation();
  const [apiScreenDirection, setApiScreenDirection] =
    useState<DirectionType>("vertical");
  const updateApiCodeHar = useApis((store) => store.updateApiCodeHar);
  const [openGenerateCode, setOpenGenerateCode] = useState<boolean>(false);
  const handleDirectionChange = (direction: DirectionType) => {
    setApiScreenDirection(direction);
  };

  const handleToCode = () => {
    updateApiCodeHar({});
    setOpenGenerateCode(true);
  };

  const tabBarExtraContent = useMemo(() => {
    return (
      <Flex align="center">
        <Button
          onClick={handleToCode}
          type="text"
          mode="light"
          size="small"
          style={{ padding: "4px 6px" }}
        >
          {t("system_settings.shortcuts.apis_detail.code")}
        </Button>
      </Flex>
    );
  }, []);

  return (
    <>
      <ToolBar
        showLayoutControl
        apisData={apisData}
        onApisDataChange={(val) => {
          onApisDataChange(val);
        }}
      />
      <Flex vertical className={styles.container}>
        <header>
          <UrlPanel apisData={apisData} onApisDataChange={onApisDataChange} />
        </header>
        <main>
          <DirectionContext.Provider value={{ direction: apiScreenDirection }}>
            <ResponseRealtimeContext.Provider
              value={{ direction: apiScreenDirection }}
            >
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
                    <Request
                      direction={apiScreenDirection}
                      apisData={apisData}
                      onApisDataChange={onApisDataChange}
                      tabBarExtraContent={tabBarExtraContent}
                    />
                  </SuspenseContent>
                }
                rightPanel={
                  <SuspenseContent>
                    <GraphQLResponseContext.Provider
                      value={{
                        kind: apisData.kind,
                        apiData: apisData,
                        onApisDataChange,
                      }}
                    >
                      <Response
                        apisData={apisData}
                        onApisDataChange={onApisDataChange}
                      />
                    </GraphQLResponseContext.Provider>
                  </SuspenseContent>
                }
                onDirectionChange={handleDirectionChange}
              />
            </ResponseRealtimeContext.Provider>
          </DirectionContext.Provider>
        </main>
        {openGenerateCode && (
          <SuspenseContent>
            <GenerateCodeDrawer
              value={apisData}
              onClose={() => setOpenGenerateCode(false)}
            />
          </SuspenseContent>
        )}
      </Flex>
    </>
  );
};

export default Index;
