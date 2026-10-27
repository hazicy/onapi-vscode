import styles from "./ToolBar.module.css";
import { saveProjectConfig } from "@/features/requests/events/env";
import { Flex, MenuProps } from "@/shared/ui/base";
import TitleEdit from "@/shared/ui/TitleEdit";
import EnvDropdown from "@/features/environment/components/EnvDropdown";
import useProjectConfig from "@/features/project/store/useProjectConfig";

import LayoutControl from "@/shared/components/ResizablePanels/LayoutControl";

interface Props<T extends { name: string }> {
  showLayoutControl?: boolean;
  apisData: T;
  onApisDataChange: (data: T) => void;
}
function ToolBar<T extends { name: string }>({
  apisData,
  onApisDataChange,
  showLayoutControl,
}: Props<T>) {
  const envDetailKeys = useProjectConfig(
    (state) => state.http!.activeEnvironment || "",
  );

  const envClick: MenuProps["onClick"] = ({ key }) => {
    // Switch environment
    const state = useProjectConfig.getState();
    const http = { ...state.http!, activeEnvironment: key };
    state.updateProjectConfig({ http } as any);
    saveProjectConfig("http", http);
  };

  return (
    <div className={styles.container}>
      <Flex
        gap={4}
        className={styles.tabBarExtraContentWrap}
        align="center"
        justify="space-between"
      >
        <Flex gap={8} align="center" className={styles.editWrap} flex={1}>
          <TitleEdit
            maxLength={255}
            className={styles.apisTitleEdit}
            value={apisData?.name}
            onChange={(event) =>
              onApisDataChange({ ...apisData, name: event.target.value })
            }
          />
        </Flex>
        <Flex style={{ height: 26 }} gap={8} align="center">
          {showLayoutControl && <LayoutControl />}
          <EnvDropdown isApis value={envDetailKeys} onEnvClick={envClick} />
        </Flex>
      </Flex>
    </div>
  );
}

export default ToolBar;
