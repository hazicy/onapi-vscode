import React from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import circleCheck from "@iconify-icons/lucide/circle-check";
import circleAlert from "@iconify-icons/lucide/circle-alert";
import triangleAlert from "@iconify-icons/lucide/triangle-alert";
import info from "@iconify-icons/lucide/info";
import loaderCircle from "@iconify-icons/lucide/loader-circle";
import x from "@iconify-icons/lucide/x";

const statusIcons: Record<string, typeof info> = {
  success: circleCheck,
  error: circleAlert,
  warning: triangleAlert,
  info,
  loading: loaderCircle,
};
import toastStyles from "./Toast.module.css";
import type { MessageInstance, NotificationInstance } from "./types";

import { Toast as BaseToast } from "@base-ui/react/toast";

export const toastManager = BaseToast.createToastManager();

const toastKeys = new Map<React.Key, string>();

function showToast(
  type: string,
  body: any,
  duration = type === "error" || type === "warning" ? 6 : 3,
  onClose?: () => void,
) {
  const config =
    body && typeof body === "object" && !React.isValidElement(body)
      ? body
      : { content: body };
  const data = {
    title: config.message ?? config.content,
    description: config.description,
    type,
    timeout: (config.duration ?? duration) * 1000,
    onClose: () => {
      if (config.key !== undefined) {
        toastKeys.delete(config.key);
      }
      (config.onClose ?? onClose)?.();
    },
  };
  const old = toastKeys.get(config.key);
  const id = old
    ? (toastManager.update(old, data), old)
    : toastManager.add(data);
  if (config.key !== undefined) {
    toastKeys.set(config.key, id);
  }
  return () => {
    toastManager.close(id);
    if (config.key !== undefined) {
      toastKeys.delete(config.key);
    }
  };
}

export const message: MessageInstance = {
  success: (b, d, c) => showToast("success", b, d, c),
  error: (b, d, c) => showToast("error", b, d, c),
  warning: (b, d, c) => showToast("warning", b, d, c),
  info: (b, d, c) => showToast("info", b, d, c),
  loading: (b, d = 0, c) => showToast("loading", b, d, c),
  open: (c) => showToast(c.type ?? "info", c),
  destroy: (key) => {
    const id = key === undefined ? undefined : toastKeys.get(key);
    if (key !== undefined && id === undefined) {
      return;
    }
    toastManager.close(id);
    if (key === undefined) {
      toastKeys.clear();
    } else {
      toastKeys.delete(key);
    }
  },
};

export const notification: NotificationInstance = {
  success: (c) => {
    showToast("success", c);
  },
  error: (c) => {
    showToast("error", c);
  },
  info: (c) => {
    showToast("info", c);
  },
  warning: (c) => {
    showToast("warning", c);
  },
  open: (c) => {
    showToast(c.type ?? "info", c);
  },
  destroy: message.destroy,
};

export function Toast() {
  const { toasts } = BaseToast.useToastManager();
  const { t } = useTranslation();
  return (
    <BaseToast.Portal>
      <BaseToast.Viewport className={toastStyles.viewport}>
        {toasts.map((toast) => (
          <BaseToast.Root
            key={toast.id}
            toast={toast}
            className={toastStyles.toast}
          >
            <Icon
              icon={statusIcons[toast.type ?? "info"] ?? info}
              className={toastStyles.icon}
              aria-hidden="true"
            />
            <BaseToast.Content className={toastStyles.content}>
              <BaseToast.Title className={toastStyles.title} />
              {toast.description && (
                <BaseToast.Description className={toastStyles.description} />
              )}
            </BaseToast.Content>
            <BaseToast.Close
              className={toastStyles.close}
              aria-label={t("base.close")}
            >
              <Icon icon={x} aria-hidden="true" />
            </BaseToast.Close>
          </BaseToast.Root>
        ))}
      </BaseToast.Viewport>
    </BaseToast.Portal>
  );
}
