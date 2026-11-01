import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import AppIcon from "@/shared/ui/AppIcon";
import styles from "./RequestAction.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon?: ReactNode;
  stopping?: boolean;
};

/** Main execution action shared by every protocol; state remains with its caller. */
export default function RequestAction({
  label,
  icon,
  stopping = false,
  className,
  ...props
}: Props) {
  return (
    <button
      {...props}
      type="button"
      data-request-action=""
      aria-label={props["aria-label"] ?? label}
      title={props.title ?? label}
      className={clsx(styles.action, className)}
    >
      {icon ?? <AppIcon icon={stopping ? "square" : "send"} />}
      <span className={styles.label}>{label}</span>
    </button>
  );
}
