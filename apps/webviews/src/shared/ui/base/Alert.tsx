import clsx from "clsx";
import type { AlertProps } from "./types";
import alertStyles from "./Alert.module.css";
import { message } from "./Toast";

export const Alert = ({
  message,
  messageClassName,
  description,
  type = "info",
  showIcon,
  icon,
  closable,
  onClose,
  action,
  className,
  style,
}: AlertProps) => (
  <div
    role={type === "error" ? "alert" : "status"}
    className={clsx(alertStyles.alert, className)}
    style={style}
  >
    {showIcon && icon}
    <div>
      <div className={messageClassName}>{message}</div>
      {description && <div>{description}</div>}
    </div>
    {action}
    {closable && (
      <button type="button" onClick={onClose} aria-label="Close">
        ×
      </button>
    )}
  </div>
);
