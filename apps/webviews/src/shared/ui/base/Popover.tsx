import clsx from "clsx";
import popoverStyles from "./Popover.module.css";
import { Popover as BasePopover } from "@base-ui/react/popover";
import type { PopoverProps } from "./types";
import { placement } from "./popupUtils";
import { node } from "./popupUtils";
import { content } from "./popupUtils";

export function Popover({
  title,
  content: body,
  children,
  nativeButton = true,
  placement: position = "top",
  trigger = "hover",
  open,
  defaultOpen,
  onOpenChange,
  popupClassName,
  positionerStyle,
  popupStyle,
  keepMounted = false,
  openDelay = 100,
  closeDelay = 100,
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
        nativeButton={nativeButton}
        openOnHover={hover}
        delay={openDelay}
        closeDelay={closeDelay}
        {...rest}
      />
      <BasePopover.Portal keepMounted={keepMounted}>
        <BasePopover.Positioner
          {...placement(position)}
          sideOffset={5}
          className={popoverStyles.positioner}
          style={positionerStyle}
        >
          <BasePopover.Popup
            className={clsx(popoverStyles.popup, popupClassName)}
            style={popupStyle}
          >
            {title && <BasePopover.Title>{content(title)}</BasePopover.Title>}
            {content(body)}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}
