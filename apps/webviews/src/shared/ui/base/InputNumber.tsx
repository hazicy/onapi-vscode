import inputNumberStyles from "./InputNumber.module.css";
import { forwardRef } from "./forwardRef";
import { NumberField } from "@base-ui/react/number-field";
import cx from "classnames";
import type { InputNumberProps } from "./types";

export const InputNumber = forwardRef<HTMLDivElement, InputNumberProps>(
  (
    {
      inputClassName,

      onChange,
      className,
      rootClassName,
      controls,
      precision,
      formatter,
      parser,
      stringMode,
      ...props
    },
    ref,
  ) => (
    <NumberField.Root
      {...props}
      ref={ref}
      className={cx(inputNumberStyles.number, className, rootClassName)}
      onValueChange={(value) =>
        onChange?.(
          stringMode && value !== null ? (String(value) as never) : value,
        )
      }
    >
      <NumberField.Group className={inputNumberStyles.inputGroup}>
        <NumberField.Input
          className={cx(inputNumberStyles.input, inputClassName)}
          aria-label={props["aria-label"]}
          placeholder={props.placeholder}
        />
        {controls !== false && (
          <span className={inputNumberStyles.steppers}>
            <NumberField.Increment aria-label="Increase">
              +
            </NumberField.Increment>
            <NumberField.Decrement aria-label="Decrease">
              −
            </NumberField.Decrement>
          </span>
        )}
      </NumberField.Group>
    </NumberField.Root>
  ),
);
