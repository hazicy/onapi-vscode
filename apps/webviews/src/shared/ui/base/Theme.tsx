import { createContext, useContext, useMemo } from "react";
import type { PropsWithChildren } from "react";

export interface ThemeConfig {
  token?: Partial<GlobalThemeToken>;
  components?: {
    Table?: { headerBg?: string; padding?: number | string };
  };
}
const ThemeContext = createContext<ThemeConfig>({ token: {} });
export function ThemeProvider({
  theme,
  children,
}: PropsWithChildren<{ theme: ThemeConfig }>) {
  const parent = useContext(ThemeContext);
  const merged = useMemo(
    () => ({
      ...parent,
      ...theme,
      token: { ...parent.token, ...theme.token },
      components: {
        Table: { ...parent.components?.Table, ...theme.components?.Table },
      },
    }),
    [parent, theme],
  );
  return (
    <ThemeContext.Provider value={merged}>{children}</ThemeContext.Provider>
  );
}
export const useThemeConfig = () => useContext(ThemeContext);
