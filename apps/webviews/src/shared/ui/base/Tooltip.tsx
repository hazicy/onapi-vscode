import cx from "classnames";
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
  mouseEnterDelay = 0.5,
  mouseLeaveDelay = 0,
  open,
  defaultOpen,
  onOpenChange,
  overlayClassName,
  overlayStyle,
  overlayInnerStyle,
  destroyTooltipOnHide,
  color,
  trigger,
  ...rest
}: TooltipProps) {
  if (title === undefined || title === null || title === "") {
    return children;
  }
  return (
    <BaseTooltip.Provider>
      <BaseTooltip.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
      >
        <BaseTooltip.Trigger
          render={node(children)}
          delay={mouseEnterDelay * 1000}
          closeDelay={mouseLeaveDelay * 1000}
          {...rest}
        />
        <BaseTooltip.Portal>
          <BaseTooltip.Positioner
            {...placement(position)}
            sideOffset={5}
            className={tooltipStyles.positioner}
            style={overlayStyle}
          >
            <BaseTooltip.Popup
              className={cx(tooltipStyles.tooltip, overlayClassName)}
              style={{ background: color, ...overlayInnerStyle }}
            >
              {content(title)}
            </BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  );
}
