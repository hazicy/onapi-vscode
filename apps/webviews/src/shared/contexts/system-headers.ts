import { createContext, useContext } from "react";
import type { DefaultRequestSystemHeaders } from "@onapi/domain/requests/types/request";

export interface SystemHeaders {
  http: DefaultRequestSystemHeaders[];
  websocket: DefaultRequestSystemHeaders[];
  onChange?: (
    protocol: "http" | "websocket",
    headers: DefaultRequestSystemHeaders[],
  ) => void;
}

export const SystemHeadersContext = createContext<SystemHeaders>({
  http: [],
  websocket: [],
});
export const useSystemHeaders = () => useContext(SystemHeadersContext);
