import { message as messageApi } from "@/shared/ui/base/Toast";
import { notification as notificationApi } from "@/shared/ui/base/Toast";
import { modal as modalApi } from "@/shared/ui/base/Modal";
import type { MessageInstance } from "@/shared/ui/base";
import type { ModalStaticFunctions } from "@/shared/ui/base";
import type { NotificationInstance } from "@/shared/ui/base";

import { create } from "zustand";

type State = {
  message?: MessageInstance;
  notification?: NotificationInstance;
  modal?: Omit<ModalStaticFunctions, "warn">;
};

type Action = {
  updateUiServices: (staticFunctions: {
    message: MessageInstance;
    notification: NotificationInstance;
    modal: Omit<ModalStaticFunctions, "warn">;
  }) => void;
};

const useUiServices = create<State & Action>()((set) => ({
  message: messageApi,
  modal: modalApi,
  notification: notificationApi,
  updateUiServices: (staticFunctions) =>
    set({
      message: staticFunctions.message,
      notification: staticFunctions.notification,
      modal: staticFunctions.modal,
    }),
}));

export default useUiServices;
