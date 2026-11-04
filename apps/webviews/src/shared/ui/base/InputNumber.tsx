import { useTranslation } from "react-i18next";
import inputNumberStyles from "./InputNumber.module.css";
import { forwardRef } from "react";
import { NumberField } from "@base-ui/react/number-field";
import clsx from "clsx";
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
      ...props
    },
    ref,
  ) => {
    const { t } = useTranslation();
    return (
      <NumberField.Root
        {...props}
        ref={ref}
        className={clsx(inputNumberStyles.number, className, rootClassName)}
        format={
          precision === undefined
            ? undefined
            : {
                maximumFractionDigits: precision,
                useGrouping: false,
              }
        }
        onValueChange={(value) =>
          onChange?.(
            value !== null && precision !== undefined
              ? Number(value.toFixed(precision))
              : value,
          )
        }
      >
        <NumberField.Group className={inputNumberStyles.inputGroup}>
          <NumberField.Input
            className={clsx(inputNumberStyles.input, inputClassName)}
            aria-label={props["aria-label"]}
            placeholder={props.placeholder}
          />
          {controls !== false && (
            <span className={inputNumberStyles.steppers}>
              <NumberField.Increment aria-label={t("ui.increase")}>
                +
              </NumberField.Increment>
              <NumberField.Decrement aria-label={t("ui.decrease")}>
                −
              </NumberField.Decrement>
            </span>
          )}
        </NumberField.Group>
      </NumberField.Root>
    );
  },
);
