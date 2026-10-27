import { useDebounceFn } from "ahooks";
import { produce } from "immer";

import useSystemConfig from "@/features/settings/store/useSystemConfig";
import { TableColumnSwitchConfig } from "@/shared/components/RequestTable/types";
import { SysConfig } from "@onapi/http-model/settings/types/settings";

type ColumnSwitchConfig = Pick<
  SysConfig,
  | "request_body_column_switch"
  | "request_query_column_switch"
  | "request_header_column_switch"
  | "request_cookie_column_switch"
  | "raw_parameter_column_switch"
>;

const useTableColumnSwitchConfig = (key: keyof ColumnSwitchConfig) => {
  const updateSystemConfig = useSystemConfig(
    (state) => state.updateSystemConfig,
  );
  const columnSwitchConfig = useSystemConfig(
    (state) => state.systemConfig[key],
  );
  const systemConfig = useSystemConfig((state) => state.systemConfig);

  const { run: saveApi } = useDebounceFn(
    async (config) => {
      try {
        window?.vscode.postMessage({
          action: "setSystemConfig",
          data: config,
        });
        // await saveSystemSetting({ configure: config });
      } catch (err) {
        // err
      }
    },
    {
      wait: 500,
    },
  );

  const onColumnSwitchConfig = (config: TableColumnSwitchConfig) => {
    const newSystemConfig = produce(systemConfig, (draft) => {
      draft[key] = config;
    });

    updateSystemConfig(newSystemConfig);
    saveApi({ [key]: config });
  };

  return {
    columnSwitchConfig,
    onColumnSwitchConfig,
  };
};

export default useTableColumnSwitchConfig;
