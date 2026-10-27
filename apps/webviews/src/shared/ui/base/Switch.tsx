import switchStyles from "./Switch.module.css";
import { forwardRef } from "./forwardRef";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import cx from "classnames";
import type { SwitchProps } from "./types";

export const Switch = forwardRef<HTMLElement, SwitchProps>(
  (
    {
      thumbClassName,

      onChange,
      checkedChildren,
      unCheckedChildren,
      loading,
      className,
      rootClassName,
      ...props
    },
    ref,
  ) => (
    <BaseSwitch.Root
      {...props}
      ref={ref}
      disabled={props.disabled || loading}
      className={cx(switchStyles.switch, className, rootClassName)}
      onCheckedChange={(checked, details) => onChange?.(checked, details.event)}
    >
      <span>{props.checked ? checkedChildren : unCheckedChildren}</span>
      <BaseSwitch.Thumb className={cx(switchStyles.thumb, thumbClassName)} />
    </BaseSwitch.Root>
  ),
);
