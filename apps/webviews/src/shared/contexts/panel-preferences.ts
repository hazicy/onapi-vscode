import { createContext, useContext } from "react";
import type { DirectionType } from "@onapi/domain/types/common";

export interface PanelPreferences {
  direction?: DirectionType;
  language: string;
  onDirectionChange?: (direction: DirectionType) => void;
}

export const PanelPreferencesContext = createContext<PanelPreferences>({
  language: "en",
});
export const usePanelPreferences = () => useContext(PanelPreferencesContext);
