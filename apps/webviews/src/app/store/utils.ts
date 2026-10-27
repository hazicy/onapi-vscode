import { create as _create } from "zustand";
import type { StateCreator } from "zustand";
import { DevtoolsOptions, devtools as _devtools } from "zustand/middleware";

/**
 * docs: {@link https://docs.pmnd.rs/zustand/guides/how-to-reset-state}
 */
const storeResetFns = new Set<() => void>();

/**
 * initialize store
 */
export const resetAllStores = () => {
  storeResetFns.forEach((resetFn) => {
    resetFn();
  });
};

/**
 * create store, override create method, add resetAllStores
 */
export const create = (<T>() => {
  return (stateCreator: StateCreator<T>) => {
    const store = _create(stateCreator);
    const initialState = store.getState();

    storeResetFns.add(() => {
      store.setState(initialState, true);
    });

    return store;
  };
}) as typeof _create;

const isDevelopment = false;

/**
 * wrap devtools middleware to disable in production, support passing other params
 */
export const devtools = <T extends object>(
  fn: StateCreator<T>,
  options?: Omit<DevtoolsOptions, "enabled">,
) => _devtools(fn, { ...options, enabled: isDevelopment });
