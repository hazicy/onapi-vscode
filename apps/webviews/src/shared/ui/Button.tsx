import styles from "./Button.module.css";
import { Button as BaseButton } from "@/shared/ui/base";

import type { ButtonProps as BaseButtonProps } from "@/shared/ui/base";

import clsx from "clsx";

export type ButtonProps = Omit<BaseButtonProps, "size"> & {
  /** Extension property for button type, add new className directly for new variant types */
  mode?: "light" | "background" | "success" | "error" | "menu-item" | "icon";
  size?: "small" | "middle" | "large" | "mini";
  btnRef?: any;
};

const Button = ({ btnRef, mode, size, ...restProps }: ButtonProps) => {
  const type = restProps.type ?? "default";
  return (
    <BaseButton
      ref={btnRef}
      {...restProps}
      rootClassName={clsx(
        mode && styles[`mode-${mode}`],
        size && styles[`size-${size}`],
        styles[`type-${type}`],
      )}
      className={clsx(styles.container, restProps.className)}
    />
  );
};
export default Button;
