import styles from "./ToolBar.module.css";
import { saveProjectConfig } from "@/features/requests/events/env";
import { FC } from "react";
import { Flex, MenuProps } from "@/shared/ui/base";
import { useMemoizedFn } from "ahooks";
import { produce } from "immer";
import TitleEdit from "@/shared/ui/TitleEdit";
import EnvDropdown from "@/features/environment/components/EnvDropdown";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import { ApiDetailsData } from "@onapi/http-model/requests/types/api";
import { ChangeFuncType } from "@onapi/http-model/types/common";

import LayoutControl from "@/shared/components/ResizablePanels/LayoutControl";

interface Props {
  showLayoutControl?: boolean;
  apisData: ApiDetailsData;
  onApisDataChange: (data: ApiDetailsData) => void;
}
const ToolBar: FC<Props> = ({
  apisData,
  onApisDataChange,
  showLayoutControl,
}) => {
  const envDetailKeys = useProjectConfig(
    (state) => state.http!.activeEnvironment || "",
  );

  const handleChange: ChangeFuncType<ApiDetailsData> = useMemoizedFn(
    <K extends keyof ApiDetailsData>(field: K, value: ApiDetailsData[K]) => {
      const newData = { ...apisData, [field]: value };

      onApisDataChange(newData);
    },
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
            onChange={(event) => handleChange("name", event.target.value)}
          />
        </Flex>
        <Flex style={{ height: 26 }} gap={8} align="center">
          {showLayoutControl && <LayoutControl />}
          <EnvDropdown isApis value={envDetailKeys} onEnvClick={envClick} />
        </Flex>
      </Flex>
    </div>
  );
};

export default ToolBar;
