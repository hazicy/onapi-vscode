import radioStyles from "./Radio.module.css";
import { forwardRef } from "./forwardRef";
import { createContext, useContext } from "react";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import cx from "classnames";
import type { RadioGroupProps, RadioProps } from "./types";
import { eventFor } from "./controlEvents";

const RadioContext = createContext(false);

const RadioControl = forwardRef<HTMLElement, RadioProps>(
  (
    {
      controlClassName,
      indicatorClassName,

      children,
      className,
      rootClassName,
      onChange,
      checked,
      defaultChecked,
      value = true,
      ...props
    },
    ref,
  ) => {
    const grouped = useContext(RadioContext);
    const radio = (
      <BaseRadio.Root
        {...props}
        value={value}
        ref={ref}
        className={cx(radioStyles.radio, controlClassName)}
        onClick={(e) => {
          props.onClick?.(e);
          onChange?.(eventFor(value, true, e.nativeEvent));
        }}
      >
        <BaseRadio.Indicator className={indicatorClassName} />
      </BaseRadio.Root>
    );
    return (
      <label className={cx(radioStyles.checkLabel, className, rootClassName)}>
        {grouped ? (
          radio
        ) : (
          <RadioGroup
            value={checked === undefined ? undefined : checked ? value : null}
            defaultValue={defaultChecked ? value : null}
          >
            {radio}
          </RadioGroup>
        )}
        {children}
      </label>
    );
  },
);

const Group = ({
  options,
  children,
  onChange,
  optionType,
  buttonStyle,
  className,
  rootClassName,
  ...props
}: RadioGroupProps) => (
  <RadioContext.Provider value={true}>
    <RadioGroup
      {...props}
      className={cx(radioStyles.flex, className, rootClassName)}
      onValueChange={(value, details) =>
        onChange?.(eventFor(value, true, details.event))
      }
    >
      {options
        ? options.map((raw: any) => {
            const o =
              typeof raw === "object" ? raw : { label: raw, value: raw };
            return (
              <RadioControl
                key={o.value}
                value={o.value}
                disabled={o.disabled || props.disabled}
              >
                {o.label}
              </RadioControl>
            );
          })
        : children}
    </RadioGroup>
  </RadioContext.Provider>
);

export const Radio = Object.assign(RadioControl, {
  Group,
  Button: RadioControl,
});
