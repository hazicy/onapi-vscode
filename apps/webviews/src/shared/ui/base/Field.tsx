import fieldStyles from "./Field.module.css";
import { useId, type CSSProperties, type ReactNode } from "react";
import cx from "classnames";

export function Field({
  labelClassName,
  contentClassName,

  label,
  children,
  error,
  required,
  hidden,
  className,
  style,
  id,
}: {
  label?: ReactNode;
  labelClassName?: string;
  contentClassName?: string;
  children: ReactNode;
  error?: string;
  required?: boolean;
  hidden?: boolean;
  className?: string;
  style?: CSSProperties;
  id?: string;
}) {
  const generatedId = useId();
  const errorId = `${id ?? generatedId}-error`;
  return (
    <div
      hidden={hidden}
      className={cx(fieldStyles.formItem, className)}
      style={style}
    >
      {label !== undefined && (
        <label className={labelClassName} htmlFor={id}>
          {required && <span aria-hidden="true">*</span>}
          {label}
        </label>
      )}
      <div className={contentClassName}>
        {children}
        {error && (
          <div id={errorId} role="alert" className={fieldStyles.error}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
