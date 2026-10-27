import { useMemo } from "react";

import { useShallow } from "zustand/react/shallow";

import useSystemConfig from "@/features/settings/store/useSystemConfig";
import { useGlobal } from "@/app/store";

import { getThemeConfig } from "@/shared/theme/theme";
import { generateToken } from "@/shared/theme/token";

/**
 * Use global theme
 */

const useGlobalTheme = () => {
  const { theme_color, bg_color, font_scale } = useSystemConfig(
    useShallow(({ systemConfig }) => ({
      theme_color: systemConfig.theme_color,
      bg_color: systemConfig.bg_color,
      font_scale: systemConfig.font_scale,
    })),
  );

  const vscodeTheme = useGlobal((store) => store.vscodeTheme);

  const themeConfig = useMemo(() => {
    return getThemeConfig(theme_color, bg_color, font_scale);
  }, [theme_color, bg_color, font_scale, vscodeTheme]);

  return {
    token: generateToken(themeConfig),
  };
};
export default useGlobalTheme;
