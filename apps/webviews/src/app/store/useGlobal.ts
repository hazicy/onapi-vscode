import { create } from "zustand";

type State = {
  vscodeTheme: string;
};

type Action = {
  updateVscodeTheme: (theme: State["vscodeTheme"]) => void;
};

const useGlobal = create<State & Action>()((set) => ({
  vscodeTheme: "Dark",
  updateVscodeTheme: (vscodeTheme) => set({ vscodeTheme }),
}));

export default useGlobal;
