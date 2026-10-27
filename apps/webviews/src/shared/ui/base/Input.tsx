import inputStyles from "./Input.module.css";
import { forwardRef } from "./forwardRef";
import { useImperativeHandle, useRef } from "react";
import { Input as BaseInput } from "@base-ui/react/input";
import cx from "classnames";
import type { InputProps, InputRef, TextAreaProps } from "./types";

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      inputClassName,
      onPressEnter,
      autoSize,
      rootClassName,
      className,
      ...props
    },
    ref,
  ) => (
    <textarea
      {...props}
      ref={ref}
      rows={props.rows ?? autoSize?.minRows ?? 2}
      className={cx(
        inputStyles.input,
        inputClassName,
        className,
        rootClassName,
      )}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);
        if (event.key === "Enter") {
          onPressEnter?.(event);
        }
      }}
    />
  ),
);

const InputControl = forwardRef<InputRef, InputProps>(
  (
    {
      inputClassName,
      outlinedClassName,
      affixClassName,

      suffixClassName,
      prefix,
      suffix,
      addonBefore,
      addonAfter,
      allowClear,
      onPressEnter,
      rootClassName,
      className,
      bordered = true,
      status,
      variant,
      size,
      style,
      ...props
    },
    ref,
  ) => {
    const input = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => ({
      input: input.current,
      focus: (options) => input.current?.focus(options),
      blur: () => input.current?.blur(),
      select: () => input.current?.select(),
    }));
    const field = (
      <BaseInput
        {...props}
        ref={input}
        style={
          !(addonBefore || addonAfter || prefix || suffix || allowClear)
            ? style
            : undefined
        }
        className={cx(
          inputStyles.input,
          inputClassName,
          bordered &&
            variant !== "borderless" &&
            cx(inputStyles.outlined, outlinedClassName),
          !prefix && !suffix && !allowClear && className,
          { [inputStyles.borderless]: !bordered || variant === "borderless" },
        )}
        onKeyDown={(e) => {
          props.onKeyDown?.(e);
          if (e.key === "Enter") {
            onPressEnter?.(e);
          }
        }}
      />
    );
    return addonBefore || addonAfter || prefix || suffix || allowClear ? (
      <span
        className={cx(
          inputStyles.group,
          inputStyles.affix,
          affixClassName,
          className,
          rootClassName,
        )}
        style={style}
      >
        {addonBefore}
        {prefix}
        {field}
        {allowClear && props.value && (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => {
              const setter = Object.getOwnPropertyDescriptor(
                HTMLInputElement.prototype,
                "value",
              )?.set;
              setter?.call(input.current, "");
              input.current?.dispatchEvent(
                new Event("input", { bubbles: true }),
              );
            }}
          >
            ×
          </button>
        )}
        {suffix && <span className={suffixClassName}>{suffix}</span>}
        {addonAfter}
      </span>
    ) : (
      field
    );
  },
);

export const Input = Object.assign(InputControl, {
  TextArea,
  Password: forwardRef<InputRef, InputProps>((props, ref) => (
    <InputControl {...props} ref={ref} type="password" />
  )),
  Search: forwardRef<InputRef, InputProps>(({ onSearch, ...props }, ref) => (
    <InputControl
      {...props}
      ref={ref}
      onPressEnter={(e) => {
        props.onPressEnter?.(e);
        onSearch?.(e.currentTarget.value, e);
      }}
    />
  )),
});
