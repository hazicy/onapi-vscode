import clsx from "clsx";
import popoverStyles from "./Popover.module.css";
import { Popover as BasePopover } from "@base-ui/react/popover";
import type { PopoverProps } from "./types";
import { placement } from "./popupUtils";
import { node } from "./popupUtils";
import { native } from "./popupUtils";
import { content } from "./popupUtils";

export function Popover({
  title,
  content: body,
  children,
  placement: position = "top",
  trigger = "hover",
  open,
  defaultOpen,
  onOpenChange,
  overlayClassName,
  overlayStyle,
  overlayInnerStyle,
  destroyTooltipOnHide = true,
  mouseEnterDelay = 0.1,
  mouseLeaveDelay = 0.1,
  ...rest
}: PopoverProps) {
  const hover = (Array.isArray(trigger) ? trigger : [trigger]).includes(
    "hover",
  );
  return (
    <BasePopover.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <BasePopover.Trigger
        render={node(children)}
        nativeButton={native(children)}
        openOnHover={hover}
        delay={mouseEnterDelay * 1000}
        closeDelay={mouseLeaveDelay * 1000}
        {...rest}
      />
      <BasePopover.Portal keepMounted={!destroyTooltipOnHide}>
        <BasePopover.Positioner
          {...placement(position)}
          sideOffset={5}
          className={popoverStyles.positioner}
          style={overlayStyle}
        >
          <BasePopover.Popup
            className={clsx(popoverStyles.popup, overlayClassName)}
            style={overlayInnerStyle}
          >
            {title && <BasePopover.Title>{content(title)}</BasePopover.Title>}
            {content(body)}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}
