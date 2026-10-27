import React, { useState } from "react";
import clsx from "clsx";
import modalStyles from "./Modal.module.css";
import { useSyncExternalStore } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useTranslation } from "react-i18next";
import type {
  ModalFuncProps,
  ModalHandle,
  ModalProps,
  ModalStaticFunctions,
} from "./types";
import { Button } from "./Button";

function ModalControl({
  headerClassName,
  bodyClassName,
  footerClassName,

  open = false,
  title,
  children,
  footer,
  okText,
  cancelText,
  onOk,
  onCancel,
  confirmLoading,
  okCancel = true,
  closable = true,
  closeIcon,
  mask = true,
  maskClosable = false,
  keyboard = true,
  centered = true,
  width = 520,
  destroyOnClose,
  destroyOnHidden,
  forceRender,
  afterClose,
  afterOpenChange,
  focusTriggerAfterClose = true,
  styles,
  className,
  rootClassName,
  style,
  zIndex = 1100,
  okButtonProps,
  cancelButtonProps,
  wrapClassName,
  ...rest
}: ModalProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [visited, setVisited] = useState(open);
  React.useEffect(() => {
    if (open) {
      setVisited(true);
    }
  }, [open]);
  const cancel = (e?: any) => onCancel?.(e);
  const buttons = (
    <>
      {okCancel && (
        <Button {...cancelButtonProps} onClick={cancel}>
          {cancelText ?? t("base.cancel")}
        </Button>
      )}
      <Button
        type="primary"
        {...okButtonProps}
        loading={busy || confirmLoading}
        onClick={async (e) => {
          setBusy(true);
          try {
            await onOk?.(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        {okText ?? t("base.confirm", "OK")}
      </Button>
    </>
  );
  return (
    <Dialog.Root
      open={open}
      modal={mask}
      disablePointerDismissal={!maskClosable}
      onOpenChange={(v, d) => {
        if (v) {
          return;
        }
        if (d.reason === "escape-key" && !keyboard) {
          d.cancel();
          return;
        }
        cancel(d.event);
      }}
      onOpenChangeComplete={(v) => {
        afterOpenChange?.(v);
        if (!v) {
          afterClose?.();
        }
      }}
    >
      <Dialog.Portal
        keepMounted={
          forceRender || (visited && !(destroyOnClose || destroyOnHidden))
        }
        className={clsx(modalStyles.container, rootClassName, wrapClassName)}
        style={{ zIndex }}
      >
        {mask && (
          <Dialog.Backdrop className={modalStyles.mask} style={styles?.mask} />
        )}
        <Dialog.Popup
          aria-describedby={undefined}
          finalFocus={focusTriggerAfterClose}
          className={clsx(modalStyles.modal, className)}
          style={{
            width,
            maxWidth: "calc(100vw - 32px)",
            ...styles?.content,
            ...style,
          }}
        >
          {closable && (
            <Dialog.Close
              className={modalStyles.close}
              aria-label={t("base.close")}
            >
              {closeIcon ?? "×"}
            </Dialog.Close>
          )}
          <Dialog.Title className={headerClassName} style={styles?.header}>
            {title ?? t("base.tip")}
          </Dialog.Title>
          <div className={bodyClassName} style={styles?.body}>
            {children}
          </div>
          {footer !== null && (
            <div
              className={clsx(modalStyles.actions, footerClassName)}
              style={styles?.footer}
            >
              {typeof footer === "function"
                ? footer(buttons, {
                    OkBtn: () => buttons,
                    CancelBtn: () => null,
                  })
                : (footer ?? buttons)}
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function createPool() {
  let entries: {
    id: number;
    config: ModalFuncProps;
    resolve: (confirmed: boolean) => void;
  }[] = [];
  let id = 0;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());
  const remove = (key: number, confirmed = false) => {
    const entry = entries.find((e) => e.id === key);
    entries = entries.filter((e) => e.id !== key);
    entry?.resolve(confirmed);
    notify();
  };
  const confirm = (config: ModalFuncProps): ModalHandle => {
    const key = ++id;
    let resolve!: (confirmed: boolean) => void;
    const result = new Promise<boolean>((done) => {
      resolve = done;
    });
    entries = [...entries, { id: key, config, resolve }];
    notify();
    return {
      destroy: () => remove(key),
      update: (next) => {
        entries = entries.map((e) =>
          e.id === key ? { ...e, config: { ...e.config, ...next } } : e,
        );
        notify();
      },
      then: result.then.bind(result),
    };
  };
  const info = (config: ModalFuncProps) =>
    confirm({ okCancel: false, ...config });
  const api = {
    confirm,
    info,
    success: info,
    error: info,
    warning: info,
    warn: info,
  };
  return {
    api,
    subscribe: (f: () => void) => {
      listeners.add(f);
      return () => {
        listeners.delete(f);
      };
    },
    get: () => entries,
    remove,
  };
}

const pool = createPool();

export const modal = pool.api;

export function ModalHost({
  source = pool,
}: {
  source?: ReturnType<typeof createPool>;
}) {
  const entries = useSyncExternalStore(
    source.subscribe,
    source.get,
    source.get,
  );
  return (
    <>
      {entries.map(({ id, config }) => (
        <ModalControl
          key={id}
          {...config}
          open
          onOk={async (e) => {
            const result = await config.onOk?.(e);
            if (result !== false) {
              source.remove(id, true);
            }
          }}
          onCancel={(e) => {
            config.onCancel?.(e);
            source.remove(id);
          }}
        >
          {config.content ?? config.children}
        </ModalControl>
      ))}
    </>
  );
}

function useModal(): [ModalStaticFunctions, React.ReactElement] {
  const [source] = useState(createPool);
  return [source.api, <ModalHost key="modal-holder" source={source} />];
}

export const Modal = Object.assign(ModalControl, {
  ...pool.api,
  useModal,
  destroyAll: () => pool.get().forEach((e) => pool.remove(e.id)),
});
