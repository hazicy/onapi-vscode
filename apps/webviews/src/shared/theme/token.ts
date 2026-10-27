export const generateToken = (themeConfig: {
  token: Partial<GlobalThemeToken>;
}) => ({
  padding: 16,
  paddingMD: 20,
  paddingSM: 12,
  paddingXS: 8,
  margin: 16,
  marginMD: 20,
  marginSM: 12,
  marginXS: 8,
  controlHeight: 32,
  controlHeightSM: 24,
  controlHeightLG: 40,
  ...themeConfig.token,
  // Partial overrides
  colorText: themeConfig.token.fontContentColor,
  colorBgElevated: themeConfig.token.colorBgRight,
  colorBorderSecondary: themeConfig.token.colorBorder,
  colorSplit: themeConfig.token.colorBorder,
  colorTextHeading: themeConfig.token.fontTitleColor,
  fontSizeHeading3: (themeConfig.token.fontSize || 12) * (3 / 2),
  colorLink: themeConfig.token.colorPrimary,
  colorTextQuaternary: themeConfig.token.fontLightColor,
});
