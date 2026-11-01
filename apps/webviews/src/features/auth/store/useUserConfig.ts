import { create } from "zustand";
import { devtools } from "@/shared/state/store";
import type { Workspace } from "@onapi/domain/project/types/workspace";
import type { UserInfo } from "@onapi/domain/auth/types/index";

type State = {
  isReadonly: boolean;
  userInfo: UserInfo;
  currentProject: Workspace;
};

type Action = {
  updateUserConfig: (state: Partial<State>) => void;
};

const useUserConfig = create<State & Action>()(
  devtools(
    (set) => ({
      isReadonly: false,
      userInfo: {} as UserInfo,
      currentProject: {} as Workspace,
      updateUserConfig: (payload) =>
        set((state) => ({
          isReadonly: payload.isReadonly ?? state.isReadonly,
          userInfo: payload.userInfo ?? state.userInfo,
          currentProject: payload.currentProject ?? state.currentProject,
        })),
    }),
    { name: "useUserConfig" },
  ),
);

export default useUserConfig;
