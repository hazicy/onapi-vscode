import { useTranslation } from "react-i18next";
import { usePanelPreferences } from "@/shared/contexts/panel-preferences";
import { Button, Flex } from "@/shared/ui/base";
import AppIcon from "@/shared/ui/AppIcon";

export default function LayoutControl() {
  const { t } = useTranslation();
  const { direction, onDirectionChange } = usePanelPreferences();

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
              vertical ? direction === "vertical" : direction === "horizontal"
            }
            disabled={!onDirectionChange}
            onClick={() =>
              onDirectionChange?.(vertical ? "vertical" : "horizontal")
            }
          >
            <AppIcon icon={vertical ? "rows-2" : "columns-2"} />
          </Button>
        );
      })}
    </Flex>
  );
}
