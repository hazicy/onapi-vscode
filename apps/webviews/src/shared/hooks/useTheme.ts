import { useThemeConfig } from "@/shared/ui/base/Theme";

export type ThemeToken = Partial<GlobalThemeToken>;

const useTheme = (): { themeToken: Partial<GlobalThemeToken> } => {
  const { token } = useThemeConfig();

  return {
    themeToken: token ?? {},
  };
};

export default useTheme;
