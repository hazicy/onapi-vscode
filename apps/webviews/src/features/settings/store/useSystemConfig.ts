import { create } from "zustand";

import { SYS_CONFIG } from "@onapi/http-model/settings/constants/settings";
import { SysConfig } from "@onapi/http-model/settings/types/settings";

type State = {
  systemConfig: SysConfig;
};

type Action = {
  updateSystemConfig: (config: SysConfig) => void;
};

const useSystemConfig = create<State & Action>()((set) => ({
  systemConfig: SYS_CONFIG,
  /** update system config */
  updateSystemConfig: (config) => set({ systemConfig: config }),
}));

export default useSystemConfig;
