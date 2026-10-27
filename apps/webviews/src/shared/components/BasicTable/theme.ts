import { ThemeToken } from "@/shared/hooks/useTheme";

export const getTheme = (themeToken: ThemeToken, { cellPadding = 8.5 }) => {
  return {
    components: {
      Table: {
        /**Header background color */
        headerBg: themeToken.colorBgRight,
        /**Cell padding */
        padding: cellPadding,
      },
    },
  };
};
