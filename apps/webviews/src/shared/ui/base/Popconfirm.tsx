import { useTranslation } from "react-i18next";
import { useState } from "react";
import type { PopconfirmProps } from "./types";
import popconfirmStyles from "./Popconfirm.module.css";
import { Button } from "./Button";

import { Popover } from "./Popover";

export function Popconfirm({
  children,
  title,
  description,
  onConfirm,
  onCancel,
  okText,
  cancelText,
  okButtonProps,
  cancelButtonProps,
  showCancel = true,
  open: controlled,
  onOpenChange,
  disabled,
  ...props
}: PopconfirmProps) {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const change = (v: boolean) => {
    setOpen(v);
    onOpenChange?.(v);
  };
  if (disabled) {
    return children;
  }
  return (
    <Popover
      {...props}
      trigger="click"
      open={controlled ?? open}
      onOpenChange={change}
      title={title}
      content={
        <>
          <div>{description}</div>
          <div className={popconfirmStyles.actions}>
            {showCancel && (
              <Button
                {...cancelButtonProps}
                onClick={(e) => {
                  onCancel?.(e);
                  change(false);
                }}
              >
                {cancelText ?? t("base.cancel")}
              </Button>
            )}
            <Button
              type="primary"
              {...okButtonProps}
              loading={busy}
              onClick={async (e) => {
                setBusy(true);
                try {
                  await onConfirm?.(e);
                  change(false);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {okText ?? t("base.confirm")}
            </Button>
          </div>
        </>
      }
    >
      {children}
    </Popover>
  );
}
