import { useEffect, useState } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Dialog } from "@base-ui/react/dialog";
import classNames from "classnames";

import css from "./Drawer.module.css";

type DrawerSection =
  | "body"
  | "header"
  | "footer"
  | "mask"
  | "content"
  | "wrapper";

export interface DrawerProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title" | "onClose"
> {
  open?: boolean;
  defaultOpen?: boolean;
  title?: ReactNode;
  extra?: ReactNode;
  footer?: ReactNode;
  width?: number | string;
  height?: number | string;
  placement?: "left" | "right" | "top" | "bottom";
  keyboard?: boolean;
  mask?: boolean;
  maskClosable?: boolean;
  closable?: boolean;
  closeIcon?: ReactNode;
  destroyOnClose?: boolean;
  destroyOnHidden?: boolean;
  forceRender?: boolean;
  autoFocus?: boolean;
  zIndex?: number;
  rootClassName?: string;
  rootStyle?: CSSProperties;
  styles?: Partial<Record<DrawerSection, CSSProperties>>;
  classNames?: Partial<Record<DrawerSection, string>>;
  onClose?: (event: Event) => void;
  afterOpenChange?: (open: boolean) => void;
}

/** Base UI implementation with the defaults of the former named Drawer export. */
export const Drawer = ({
  open: controlledOpen,
  defaultOpen = false,
  title,
  extra,
  footer,
  children,
  width = 378,
  height = 378,
  placement = "right",
  keyboard = true,
  mask = true,
  maskClosable = true,
  closable = true,
  closeIcon,
  destroyOnClose = false,
  destroyOnHidden = false,
  forceRender = false,
  autoFocus = true,
  zIndex = 1000,
  rootClassName,
  rootStyle,
  className,
  style,
  styles,
  classNames: sectionClasses,
  onClose,
  afterOpenChange,
  "aria-label": ariaLabel,
  ...rest
}: DrawerProps) => {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const [hasOpened, setHasOpened] = useState(open);
  useEffect(() => {
    if (open) {
      setHasOpened(true);
    }
  }, [open]);
  const horizontal = placement === "left" || placement === "right";
  const popupStyle = {
    "--drawer-width": typeof width === "number" ? `${width}px` : width,
    "--drawer-height": typeof height === "number" ? `${height}px` : height,
    ...styles?.wrapper,
    ...styles?.content,
    ...style,
  } as CSSProperties;

  return (
    <Dialog.Root
      open={open}
      modal={mask}
      disablePointerDismissal={!mask || !maskClosable}
      onOpenChange={(nextOpen, details) => {
        if (nextOpen) {
          return;
        }
        if (details.reason === "escape-key" && !keyboard) {
          details.cancel();
          return;
        }
        if (controlledOpen === undefined) {
          setInternalOpen(false);
        }
        onClose?.(details.event);
      }}
      onOpenChangeComplete={afterOpenChange}
    >
      <Dialog.Portal
        keepMounted={
          forceRender || (hasOpened && !(destroyOnClose || destroyOnHidden))
        }
        className={classNames(css.root, rootClassName)}
        style={{ zIndex, ...rootStyle }}
      >
        {mask && (
          <Dialog.Backdrop
            className={classNames(css.mask, sectionClasses?.mask)}
            style={styles?.mask}
          />
        )}
        <Dialog.Popup
          {...rest}
          data-onapi-drawer=""
          aria-label={ariaLabel}
          aria-describedby={undefined}
          initialFocus={autoFocus}
          className={classNames(
            css.popup,
            className,
            sectionClasses?.wrapper,
            sectionClasses?.content,
          )}
          data-placement={placement}
          data-horizontal={horizontal || undefined}
          style={popupStyle}
        >
          <header
            className={classNames(css.header, sectionClasses?.header)}
            style={styles?.header}
          >
            {closable && closeIcon !== null && closeIcon !== false && (
              <Dialog.Close className={css.close} aria-label={t("base.close")}>
                {closeIcon ?? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path
                      d="m4 4 8 8m0-8-8 8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                )}
              </Dialog.Close>
            )}
            <Dialog.Title
              className={classNames(
                css.title,
                (title === null || title === undefined) && css.visuallyHidden,
              )}
            >
              {title ?? t("base.drawer", "Drawer")}
            </Dialog.Title>
            {extra !== null && extra !== undefined && (
              <div className={css.extra}>{extra}</div>
            )}
          </header>
          <div
            className={classNames(css.body, sectionClasses?.body)}
            style={styles?.body}
          >
            {children}
          </div>
          {footer !== null && footer !== undefined && (
            <footer
              className={classNames(css.footer, sectionClasses?.footer)}
              style={styles?.footer}
            >
              {footer}
            </footer>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

const CustomDrawer = ({
  width = 1000,
  keyboard = false,
  maskClosable = false,
  ...props
}: DrawerProps) => (
  <Drawer
    width={width}
    keyboard={keyboard}
    maskClosable={maskClosable}
    {...props}
  />
);

export default CustomDrawer;
