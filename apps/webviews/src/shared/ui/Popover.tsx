import {
  Popover as BasePopover,
  PopoverProps as BasePopoverProps,
} from "@/shared/ui/base";

export type PopoverProps = BasePopoverProps;

const Popover = (props: PopoverProps) => {
  const { popupStyle = {}, keepMounted = false, ...restProps } = props;

  const defaultOverlayInnerStyle = {
    padding: "16px 20px",
  };

  return (
    <BasePopover
      keepMounted={keepMounted}
      popupStyle={{ ...defaultOverlayInnerStyle, ...popupStyle }}
      {...restProps}
    />
  );
};

export default Popover;
