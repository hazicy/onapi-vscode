import clsx from "clsx";
import type { UIProps } from "./types";
import appStyles from "./App.module.css";
import { modal } from "./Modal";
import { ModalHost } from "./Modal";
import { Toast as BaseToast } from "@base-ui/react/toast";
import { Toast, toastManager, message, notification } from "./Toast";

export const App = Object.assign(
  ({ children, className, style }: UIProps) => (
    <BaseToast.Provider toastManager={toastManager}>
      <div className={clsx(appStyles.app, className)} style={style}>
        {children}
      </div>
      <Toast />
      <ModalHost />
    </BaseToast.Provider>
  ),
  { useApp: () => ({ message, notification, modal }) },
);
