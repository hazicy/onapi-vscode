import type {
  HttpEditorProps,
  HttpEditorRecord,
} from "@onapi/domain/requests/record";
import styles from "./HttpDebug.module.css";
import { FC, lazy, Suspense, useState } from "react";
import { Dropdown } from "@/shared/ui/base";
import AppIcon from "@/shared/ui/AppIcon";
import { produce } from "immer";
import ResizablePanels from "@/shared/components/ResizablePanels/ResizablePanels";
import SuspenseContent from "@/shared/components/SuspenseContent";

import useRequestWorkspaceStore from "@/features/requests/store/useRequestWorkspaceStore";
import Request from "@/features/requests/editor/Request/Request";
import Response from "./Response";
import Header from "./Header";
import { useTranslation } from "react-i18next";

import context from "@/shared/components/RawEditor/visualizationContext";
const GenerateCodeModal = lazy(
  () => import("@/features/requests/code-generation/GenerateCodeModal"),
);

const panelProps = {
  defaultSize: 50,
  minSize: 5,
  collapsible: true,
  collapsedSize: 5,
};

const ApiDebug: FC<HttpEditorProps> = ({ apisData, onApisDataChange }) => {
  const { t } = useTranslation();
  const setRequestHar = useRequestWorkspaceStore(
    (store) => store.setRequestHar,
  );
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
    setRequestHar({});
    setOpenGenerateCode(true);
  };

  const tabBarExtraContent = (
    <Dropdown
      trigger={["click"]}
      menu={{
        items: [
          {
            key: "code",
            label: t("system_settings.shortcuts.apis_detail.code"),
            onClick: handleToCode,
          },
        ],
      }}
    >
      <button
        type="button"
        className={styles.actionButton}
        aria-label={t("request_panel.more")}
        title={t("request_panel.more")}
      >
        <AppIcon icon="ellipsis" />
      </button>
    </Dropdown>
  );

  return (
    <>
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
        <Suspense fallback={null}>
          <GenerateCodeModal
            value={apisData}
            onClose={() => setOpenGenerateCode(false)}
          />
        </Suspense>
      )}
    </>
  );
};

export default ApiDebug;
