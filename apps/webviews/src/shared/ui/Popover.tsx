import {
  Popover as BasePopover,
  PopoverProps as BasePopoverProps,
} from "@/shared/ui/base";

export type PopoverProps = BasePopoverProps;

const Popover = (props: PopoverProps) => {
  const {
    overlayInnerStyle = {},
    destroyTooltipOnHide = true,
    ...restProps
  } = props;

  const defaultOverlayInnerStyle = {
    padding: "16px 20px",
  };

  return (
    <BasePopover
      destroyTooltipOnHide={destroyTooltipOnHide}
      overlayInnerStyle={{ ...defaultOverlayInnerStyle, ...overlayInnerStyle }}
      {...restProps}
    />
  );
};

export default Popover;
