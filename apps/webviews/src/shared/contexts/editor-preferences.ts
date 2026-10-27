import { createContext, useContext } from "react";

export interface EditorPreferences {
  theme: string;
  fontSize: number;
  fontFamily: string;
  lightJsonTheme: boolean;
  resolveVariable?: (expression: string) => Promise<string | undefined>;
}

export const EditorPreferencesContext = createContext<EditorPreferences>({
  theme: "",
  fontSize: 14,
  fontFamily: "monospace",
  lightJsonTheme: false,
});

export const useEditorPreferences = () => useContext(EditorPreferencesContext);
