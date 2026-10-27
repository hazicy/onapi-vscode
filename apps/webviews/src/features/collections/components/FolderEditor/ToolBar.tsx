import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Flex, MenuProps } from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import { cloneDeep, isEqual } from "lodash-es";

import { Button } from "@/shared/ui";
import { APIS_TARGET_TYPE_ENUM } from "@onapi/http-model/requests/constants/index";

import useApis from "@/features/requests/store/useApis";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import useUserConfig from "@/features/auth/store/useUserConfig";
import EnvDropdown from "@/features/environment/components/EnvDropdown";
import { saveProjectConfig } from "@/features/requests/events/env";

interface Props {
  targetId?: string;
}

const ToolBar: FC<Props> = ({}) => {
  const { t } = useTranslation();
  const [saveLoading, setSaveLoading] = useSafeState(false);
  const envDetailKeys = useProjectConfig(
    (state) => state.http!.activeEnvironment || "",
  );

  const apisData = useApis((store) => store.apisActiveData);

  const isReadonly = useUserConfig((state) => state.isReadonly);

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      const result = cloneDeep(apisData);
      // await saveApis({ data: result });
      window?.vscode.postMessage({
        action: "saveApiData",
        data: result,
      });
    } catch (error) {
    } finally {
      setSaveLoading(false);
    }
  };

  const envClick: MenuProps["onClick"] = ({ key }) => {
    // Switch environment
    const state = useProjectConfig.getState();
    const http = { ...state.http!, activeEnvironment: key };
    state.updateProjectConfig({ http } as any);
    saveProjectConfig("http", http);
  };

  if (isEqual(apisData?.kind, APIS_TARGET_TYPE_ENUM.FOLDER)) {
    return (
      <Flex justify="flex-end" gap={8}>
        <Flex style={{ height: 26 }}>
          <EnvDropdown value={envDetailKeys} onEnvClick={envClick} />
        </Flex>
        <Button
          size="small"
          type="primary"
          loading={saveLoading}
          disabled={isReadonly}
          onClick={handleSave}
        >
          {t("api.mock.expectation_set.save")}
        </Button>
      </Flex>
    );
  }

  return <></>;
};

export default ToolBar;
