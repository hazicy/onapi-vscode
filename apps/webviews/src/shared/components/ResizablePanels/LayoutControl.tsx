import { useTranslation } from "react-i18next";
import { useSystemConfig } from "@/app/store";
import { STATUS_CODE } from "@onapi/http-model/constants/common";
import { Button, Flex } from "@/shared/ui/base";
import AppIcon from "@/shared/ui/AppIcon";

export default function LayoutControl() {
  const { t } = useTranslation();
  const direction = useSystemConfig(
    (state) => state.systemConfig?.tab_direction,
  );

  const changeDirection = (vertical: boolean) => {
    const tab_direction = vertical ? STATUS_CODE.ENABLE : STATUS_CODE.DISABLE;
    const { systemConfig, updateSystemConfig } = useSystemConfig.getState();
    updateSystemConfig({ ...systemConfig, tab_direction });
    window?.vscode.postMessage({
      action: "setSystemConfig",
      data: { tab_direction },
    });
  };

  return (
    <Flex gap={4} align="center">
      {[true, false].map((vertical) => {
        const label = t(
          `common.response_component.${vertical ? "single_pane" : "two_pane"}`,
        );
        return (
          <Button
            key={String(vertical)}
            type="text"
            size="small"
            title={label}
            aria-label={label}
            aria-pressed={
              vertical
                ? direction === STATUS_CODE.ENABLE
                : direction === STATUS_CODE.DISABLE
            }
            onClick={() => changeDirection(vertical)}
          >
            <AppIcon icon={vertical ? "rows-2" : "columns-2"} />
          </Button>
        );
      })}
    </Flex>
  );
}
