import checkboxStyles from "./Checkbox.module.css";
import { forwardRef } from "./forwardRef";
import { useState } from "react";
import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import clsx from "clsx";
import type { CheckboxProps, UIProps } from "./types";
import { eventFor } from "./controlEvents";

const CheckboxControl = forwardRef<HTMLElement, CheckboxProps>(
  (
    {
      controlClassName,

      children,
      onChange,
      value,
      className,
      rootClassName,
      indeterminate,
      ...props
    },
    ref,
  ) => (
    <label
      className={clsx(checkboxStyles.checkLabel, className, rootClassName)}
    >
      <BaseCheckbox.Root
        {...props}
        ref={ref}
        indeterminate={indeterminate}
        className={clsx(checkboxStyles.checkbox, controlClassName)}
        onCheckedChange={(checked, details) =>
          onChange?.(eventFor(value, checked, details.event))
        }
      >
        <BaseCheckbox.Indicator>
          {indeterminate ? "−" : "✓"}
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      {children}
    </label>
  ),
);

function CheckboxGroup({
  options = [],
  value,
  defaultValue = [],
  onChange,
  children,
  ...props
}: UIProps) {
  const [internal, set] = useState(defaultValue);
  const selected = value ?? internal;
  return (
    <div {...props} className={clsx(checkboxStyles.flex, props.className)}>
      {children ??
        options.map((raw: any) => {
          const option =
            typeof raw === "object" ? raw : { value: raw, label: raw };
          return (
            <CheckboxControl
              key={option.value}
              checked={selected.includes(option.value)}
              disabled={option.disabled || props.disabled}
              onChange={(e) => {
                const next = e.target.checked
                  ? [...selected, option.value]
                  : selected.filter((v: any) => v !== option.value);
                set(next);
                onChange?.(next);
              }}
            >
              {option.label}
            </CheckboxControl>
          );
        })}
    </div>
  );
}

export const Checkbox = Object.assign(CheckboxControl, {
  Group: CheckboxGroup,
});
