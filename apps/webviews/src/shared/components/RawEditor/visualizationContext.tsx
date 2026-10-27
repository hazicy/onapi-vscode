import { createContext } from "react";

interface RequestProviderProps {
  isDebugArea: boolean;
}

export const context = createContext<RequestProviderProps>({
  isDebugArea: false,
});

export default context;
