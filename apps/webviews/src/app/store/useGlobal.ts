import { NavigateFunction } from "react-router-dom";

import { create } from "zustand";

import { CustomNumberBooleanType } from "@onapi/domain/types/common";

type State = {
  /** collaboration websocket returned client id */
  clientId: string;
  /** cancel request token */
  cancelToken: any;
  /** route navigation */
  navigate: NavigateFunction | null;
  /** ai description toggle */
  aiDescEnable: CustomNumberBooleanType;
  /** vscode current theme */
  vscodeTheme: string;
  /** project switching state */
  switchingProject: boolean;
  /** project initialization state */
  initLoading: boolean;
};

type Action = {
  updateInitLoading: (p: State["initLoading"]) => void;
  updateSwitchingProject: (p: State["switchingProject"]) => void;
  updateWsClientId: (p: State["clientId"]) => void;
  updateCancelToken: (p: State["cancelToken"]) => void;
  updateNavigate: (p: State["navigate"]) => void;
  updateAiDescEnable: (p: State["aiDescEnable"]) => void;
  updateVscodeTheme: (p: State["vscodeTheme"]) => void;
};

const useGlobal = create<State & Action>()((set) => ({
  clientId: "",
  navigate: null,
  switchingProject: false,
  aiDescEnable: -1,
  loading: false,
  initLoading: true,
  vscodeTheme: "Dark",
  cancelToken: () => undefined,
  updateCancelToken: (cancelToken) => set(() => ({ cancelToken })),
  updateInitLoading: (initLoading) => set(() => ({ initLoading })),
  updateSwitchingProject: (switchingProject) =>
    set(() => ({ switchingProject })),
  updateNavigate: (navigate) => set(() => ({ navigate })),
  updateWsClientId: (clientId) => set(() => ({ clientId })),
  updateAiDescEnable: (aiDescEnable) => set(() => ({ aiDescEnable })),
  updateVscodeTheme: (vscodeTheme) => set(() => ({ vscodeTheme })),
}));

export default useGlobal;
