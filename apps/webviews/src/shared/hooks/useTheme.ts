import { theme } from "@/shared/ui/base";

const { useToken } = theme;

export type ThemeToken = Partial<GlobalThemeToken>;

const useTheme = (): { themeToken: Partial<GlobalThemeToken> } => {
  const { token } = useToken();

  return {
    themeToken: token,
  };
};

export default useTheme;
