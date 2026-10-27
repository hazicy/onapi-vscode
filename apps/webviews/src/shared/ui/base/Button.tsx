import buttonStyles from "./Button.module.css";
import { forwardRef } from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import clsx from "clsx";
import type { ButtonProps } from "./types";

export const Button = forwardRef<HTMLElement, ButtonProps>(
  (
    {
      iconClassName,

      type = "default",
      htmlType = "button",
      size = "middle",
      loading = false,
      icon,
      children,
      className,
      rootClassName,
      danger,
      ghost,
      block,
      shape,
      ...props
    },
    ref,
  ) => (
    <BaseButton
      {...props}
      ref={ref}
      type={htmlType}
      disabled={props.disabled || !!loading}
      className={clsx(
        buttonStyles.button,
        type !== "default" && buttonStyles[`button-${type}`],
        size === "small"
          ? buttonStyles.small
          : size === "large"
            ? buttonStyles.large
            : undefined,
        className,
        rootClassName,
        {
          [buttonStyles.danger]: danger,
          [buttonStyles.block]: block,
          [buttonStyles.ghost]: ghost,
        },
      )}
    >
      {loading ? (
        <span className={buttonStyles.spinner} aria-label="Loading" />
      ) : (
        icon && (
          <span className={clsx(buttonStyles.icon, iconClassName)}>{icon}</span>
        )
      )}
      {children}
    </BaseButton>
  ),
);
