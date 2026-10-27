import { useSyncExternalStore } from "react";

let settings = {
  vscodeTheme: "Default Dark Modern",
  systemConfig: { font_size: 14, font_family: "monospace" },
};
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export function setTheme(vscodeTheme: string) {
  settings = { ...settings, vscodeTheme };
  listeners.forEach((listener) => listener());
}
export function useGlobal<T>(selector: (state: typeof settings) => T) {
  return selector(useSyncExternalStore(subscribe, () => settings));
}
export const useSystemConfig = useGlobal;
