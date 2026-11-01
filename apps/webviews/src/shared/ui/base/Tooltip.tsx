import clsx from "clsx";
import tooltipStyles from "./Tooltip.module.css";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { TooltipProps } from "./types";
import { placement } from "./popupUtils";
import { node } from "./popupUtils";
import { content } from "./popupUtils";

export function Tooltip({
  title,
  children,
  placement: position = "top",
  openDelay = 500,
  closeDelay = 0,
  open,
  defaultOpen,
  onOpenChange,
  popupClassName,
  positionerStyle,
  popupStyle,
  keepMounted = false,
  color,
  ...rest
}: TooltipProps) {
  const hasTitle = title !== undefined && title !== null && title !== "";
  return (
    <BaseTooltip.Provider>
      <BaseTooltip.Root
        disabled={!hasTitle}
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
      >
        <BaseTooltip.Trigger
          render={node(children)}
          delay={openDelay}
          closeDelay={closeDelay}
          {...rest}
        />
        <BaseTooltip.Portal keepMounted={keepMounted}>
          <BaseTooltip.Positioner
            {...placement(position)}
            sideOffset={5}
            className={tooltipStyles.positioner}
            style={positionerStyle}
          >
            <BaseTooltip.Popup
              className={clsx(tooltipStyles.tooltip, popupClassName)}
              style={{ background: color, ...popupStyle }}
            >
              {content(title)}
            </BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  );
}
