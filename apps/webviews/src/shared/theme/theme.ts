import { PRIMARY_COLOR_MAP } from "@onapi/domain/constants/common";
import { hexToRGBA } from "@/shared/utils/common";

/**
 * Get theme configuration
 * @param primaryColor Theme color
 * @param themeMode Theme mode
 * @returns {object} Theme configuration
 */
type themeModeType =
  | "white"
  | "dark"
  | "gray"
  | "orange"
  | "lightgray"
  | "darkgrey";
type primaryColorType =
  | "orange"
  | "blue"
  | "green"
  | "pink"
  | "purple"
  | "lakeblue"
  | "pinkpurple";

export const getThemeConfig = (
  primaryColor: primaryColorType,
  themeMode: themeModeType,
  systemScale: number = 100,
) => {
  const fontSize = Math.round((12 * systemScale) / 100);
  const fontSize14 = Math.round((14 * systemScale) / 100);
  const fontSize16 = Math.round((16 * systemScale) / 100);

  const vscodeBtnBgColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--vscode-button-background")
    .trim();

  // Default token
  const defaultToken = {
    fontFamily:
      'var(--vscode-font-family, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", sans-serif)',
    lineHeight: 1.4,
    borderRadius: 4,
    colorPrimary: vscodeBtnBgColor || PRIMARY_COLOR_MAP[primaryColor],
    iconPrimaryColor: vscodeBtnBgColor || PRIMARY_COLOR_MAP[primaryColor],
    SelectedBorderColor: hexToRGBA(
      vscodeBtnBgColor || PRIMARY_COLOR_MAP[primaryColor],
      0.5,
    ),
    WhiteColor: "#fff",
    colorError: "#ff583e",
    colorSuccess: "#26CEA4",
    fontSize,
    fontSize14,
    fontSize16,

    padding8: 8,
    padding10: 10,
    padding12: 12,
    padding14: 14,
    padding16: 16,
    padding18: 18,
    padding20: 20,

    margin8: 8,
    margin10: 10,
    margin12: 12,
    margin14: 14,
    margin16: 16,
    margin18: 18,
    margin20: 20,
    colorErrorBg: hexToRGBA("#F92814", 0.1),
    colorSuccessBg: hexToRGBA("#0cbb52", 0.1),
    colorWarningBg: hexToRGBA("#ffb400", 0.1),
    colorInfoBg: hexToRGBA("#097bed", 0.1),
  };

  switch (themeMode) {
    case "dark":
      return {
        token: {
          ...defaultToken,
          colorPrimaryOpacity: hexToRGBA(
            vscodeBtnBgColor || PRIMARY_COLOR_MAP[primaryColor],
            0.1,
          ),
          colorBgGray: "var(--vscode-toolbar-hoverBackground)",
          colorFontLightHover: hexToRGBA(
            vscodeBtnBgColor || PRIMARY_COLOR_MAP[primaryColor],
            0.7,
          ),
          colorBgLightHover: hexToRGBA(
            vscodeBtnBgColor || PRIMARY_COLOR_MAP[primaryColor],
            0.1,
          ),
          colorDashed: "var(--vscode-settings-headerBorder)",
          colorBgPage: "var(--vscode-sideBar-background, #262626)",
          colorBgTreePage: "transparent",
          colorBgRight: "var(--vscode-editor-background,#121212)",
          colorBgFolder: "var(--vscode-editorWidget-border, #262628)",
          headerBgColor: "var(--vscode-editorWidget-border, #262628)",
          searchBgColor: "var(--vscode-editor-background,#121212)",
          tableHeaderBgColor: "var(--vscode-settings-focusedRowBackground)",
          searchBigBgColor: "var(--vscode-settings-focusedRowBackground)",
          searchBigSelectColor: "var(--vscode-settings-focusedRowBackground)",
          popoverSelectBgColor: "var(--vscode-editor-background,#121212)",
          popoverSelectBgHoverColor:
            "var(--vscode-list-inactiveSelectionBackground)",
          colorBgFolderHover: "var(--vscode-list-inactiveSelectionBackground)",
          colorDeepGray:
            "var(--vscode-editorInlayHint-parameterForeground, var(--vscode-foreground, #A6A6A6))",
          selectHoverColor: hexToRGBA(
            vscodeBtnBgColor || PRIMARY_COLOR_MAP[primaryColor],
            0.1,
          ),
          formHoverColor: "var(--vscode-editorHoverWidget-background, #1a1a1b)",
          highlightChangeColor:
            "var(--vscode-editorHoverWidget-statusBarBackground, #303033)",
          dividerColor: "var(--vscode-sideBar-background, #262626)",
          checkBoxBorderColor: "var(--vscode-settings-headerBorder)",
          colorBorder: "var(--vscode-settings-headerBorder)",
          tableColorBorder: "var(--vscode-settings-headerBorder)",
          colorHeaderBorder: "var(--vscode-editorWidget-border, #262628)",
          colorBorderLight: "#2c2c2c",
          iconColor: "var(--vscode-icon-foreground)",
          fontTitleColor:
            "var(--vscode-breadcrumb-focusForeground, var(--vscode-foreground, #FFFFFF))",
          fontContentColor: "var(--vscode-foreground)",
          fontLightColor:
            "var(--vscode-gitDecoration-ignoredResourceForeground)",
          colorWhite: "#fff",
          boxShadowModalColor: "rgba(0, 0, 0, 0.2)",
          scrollbarThumbBgColor:
            "var(--vscode-scrollbarSlider-background, #242427)",
          scrollbarThumbHoverBgColor:
            "var(--vscode-scrollbarSlider-hoverBackground, #323237)",
          modalContentBg: "var(--vscode-editor-background, #181818)",
          modalMaskBg: hexToRGBA("#0A0A0A", 0.7),
          exampleTabColor:
            "var(--vscode-settings-focusedRowBackground, #303033)",
        },
      };
    case "lightgray":
      return {
        token: {
          ...defaultToken,
          colorPrimaryOpacity: hexToRGBA(PRIMARY_COLOR_MAP[primaryColor], 0.1),
          colorFontLightHover: hexToRGBA(PRIMARY_COLOR_MAP[primaryColor], 0.7),
          colorBgLightHover: hexToRGBA(PRIMARY_COLOR_MAP[primaryColor], 0.1),
          colorBgGray: "#2b3138",
          colorDashed: "#33373f",
          colorBgPage: "#20252c",
          colorBgTreePage: "transparent",
          colorBgRight: "#1c2026",
          colorBgFolder: "#282d34",
          headerBgColor: "#282d34",
          searchBgColor: "#191c21",
          tableHeaderBgColor: "#21262d",
          searchBigBgColor: "#171b1f",
          searchBigSelectColor: "#252a32",
          popoverSelectBgColor: "#2d3138",
          popoverSelectBgHoverColor: "#353940",
          colorBgFolderHover: "#282e37",
          colorDeepGray: "#373b45",
          selectHoverColor: hexToRGBA(PRIMARY_COLOR_MAP[primaryColor], 0.1),
          formHoverColor: "#21252d",
          highlightChangeColor: "#373c44",
          dividerColor: "#171b1f",
          checkBoxBorderColor: "#373d46",
          colorBorder: "#272c35",
          colorHeaderBorder: "#272c35",
          colorBorderLight: "#2c2c2c",
          iconColor: "#4b515a",
          fontTitleColor: "#ededed",
          fontContentColor: "#cecfd2",
          fontLightColor: hexToRGBA("#c6c9d2", 0.45),
          colorWhite: "#fff",
          boxShadowModalColor: "rgba(0, 0, 0, 0.1)",
          scrollbarThumbBgColor: "#242a31",
          scrollbarThumbHoverBgColor: "#2f3740",
          modalContentBg: "#1c2026",
          modalMaskBg: hexToRGBA("#0A0A0A", 0.7),
        },
      };
    case "darkgrey":
      return {
        token: {
          ...defaultToken,
          colorPrimaryOpacity: hexToRGBA(PRIMARY_COLOR_MAP[primaryColor], 0.1),
          colorFontLightHover: hexToRGBA(PRIMARY_COLOR_MAP[primaryColor], 0.7),
          colorBgLightHover: hexToRGBA(PRIMARY_COLOR_MAP[primaryColor], 0.1),
          colorBgGray: "#212429",
          colorDashed: "#33373f",
          colorBgPage: "#1f2126",
          colorBgTreePage: "transparent",
          colorBgRight: "#25282e",
          colorBgFolder: "#17191d",
          headerBgColor: "#17191d",
          searchBgColor: "#191a1f",
          tableHeaderBgColor: "#2C3039",
          searchBigBgColor: "#1f2126",
          searchBigSelectColor: "#292c33",
          popoverSelectBgColor: "#2c3038",
          popoverSelectBgHoverColor: "#343942",
          colorBgFolderHover: "#2a2d34",
          colorDeepGray: "#2d3037",
          selectHoverColor: hexToRGBA(PRIMARY_COLOR_MAP[primaryColor], 0.1),
          formHoverColor: "#2c3037",
          highlightChangeColor: "#343844",
          dividerColor: "#1f2126",
          checkBoxBorderColor: "#30363f",
          colorBorder: "#30363f",
          colorHeaderBorder: "#17191D",
          colorBorderLight: "#2e3033",
          iconColor: "#525761",
          fontTitleColor: "#ededed",
          fontContentColor: "#c7cad2",
          fontLightColor: hexToRGBA("#c7cad2", 0.4),
          colorWhite: "#fff",
          boxShadowModalColor: "rgba(0, 0, 0, 0.2)",
          scrollbarThumbBgColor: "#2a2d34",
          scrollbarThumbHoverBgColor: "#2f333a",
          modalContentBg: "#25282e",
          modalMaskBg: hexToRGBA("#0A0A0A", 0.7),
        },
      };
    case "gray":
      return {
        token: {
          ...defaultToken,
          colorPrimaryOpacity: hexToRGBA(PRIMARY_COLOR_MAP[primaryColor], 0.1),
          colorFontLightHover: hexToRGBA(PRIMARY_COLOR_MAP[primaryColor], 0.7),
          colorBgLightHover: hexToRGBA(PRIMARY_COLOR_MAP[primaryColor], 0.1),
          colorBgGray: "#30313e",
          colorDashed: "#363950",
          colorBgPage: "#222430",
          colorBgTreePage: "transparent",
          colorBgRight: "#1e1f28",
          colorBgFolder: "#282a37",
          headerBgColor: "#282a37",
          searchBgColor: "#1c1f28",
          tableHeaderBgColor: "#242630",
          searchBigBgColor: "#171821",
          searchBigSelectColor: "#262734",
          popoverSelectBgColor: "#282a38",
          popoverSelectBgHoverColor: "#2e303e",
          colorBgFolderHover: "#2e303f",
          colorDeepGray: "#353744",
          selectHoverColor: hexToRGBA(PRIMARY_COLOR_MAP[primaryColor], 0.1),
          formHoverColor: "#222430",
          highlightChangeColor: "#2e3043",
          dividerColor: "#171821",
          checkBoxBorderColor: "#333741",
          colorBorder: "#272b36",
          colorHeaderBorder: "#272b36",
          colorBorderLight: hexToRGBA("#272b36", 0.6),
          iconColor: "#525465",
          fontTitleColor: "#e2e2e8",
          fontContentColor: "#cccdd7",
          fontLightColor: hexToRGBA("#acb0c3", 0.5),
          colorWhite: "#fff",
          boxShadowModalColor: "rgba(14, 19, 31, 0.2)",
          scrollbarThumbBgColor: "#2e3043",
          scrollbarThumbHoverBgColor: "#3b3d55",
          modalContentBg: "#1f212b",
          modalMaskBg: hexToRGBA("#0a0a10", 0.59),
        },
      };
    case "orange":
      return {
        token: {
          ...defaultToken,
          colorPrimaryOpacity: hexToRGBA(PRIMARY_COLOR_MAP[primaryColor], 0.1),
          colorFontLightHover: hexToRGBA(PRIMARY_COLOR_MAP[primaryColor], 0.7),
          colorBgLightHover: hexToRGBA(PRIMARY_COLOR_MAP[primaryColor], 0.1),
          colorBgGray: "#f5f1e7",
          colorDashed: "#e7e1d0",
          colorBgPage: "#f5f1e7",
          colorBgTreePage: "transparent",
          colorBgRight: "#fbf7ee",
          colorBgFolder: "#eeeae0",
          headerBgColor: "#fbf7ee",
          searchBgColor: "#ede9de",
          tableHeaderBgColor: "#f1ede3",
          searchBigBgColor: "#efeadd",
          searchBigSelectColor: "#fbf7ee",
          popoverSelectBgColor: "#fcf9f3",
          popoverSelectBgHoverColor: "#f6f1e8",
          colorBgFolderHover: "#eae5d9",
          colorDeepGray: "#e1ddd2",
          selectHoverColor: hexToRGBA(PRIMARY_COLOR_MAP[primaryColor], 0.1),
          formHoverColor: "#f5f1e7",
          highlightChangeColor: "#fffbf4",
          dividerColor: "#f1ede2",
          checkBoxBorderColor: "#ede8db",
          colorBorder: "#ede8db",
          colorHeaderBorder: "#ede8db",
          colorBorderLight: "#e5e2db",
          iconColor: "#a19e95",
          fontTitleColor: "#484641",
          fontContentColor: "#4c4b46",
          fontLightColor: "#bab8b2",
          colorWhite: "#fff",
          boxShadowModalColor: "rgba(239, 234, 226, 1)",
          scrollbarThumbBgColor: "#e9e5db",
          scrollbarThumbHoverBgColor: "#e2dccf",
          modalContentBg: "#fbf7ee",
          modalMaskBg: hexToRGBA("#d6d3ca", 0.4),
        },
      };
    default:
      return {
        token: {
          ...defaultToken,
          colorPrimaryOpacity: hexToRGBA(PRIMARY_COLOR_MAP[primaryColor], 0.05),
          colorFontLightHover: hexToRGBA(PRIMARY_COLOR_MAP[primaryColor], 0.7),
          colorBgLightHover: hexToRGBA(PRIMARY_COLOR_MAP[primaryColor], 0.1),
          colorBgGray: "#f5f7f9",
          colorDashed: "#e9ebf1",
          colorBgPage: "#f9fafb",
          colorBgTreePage: "#f9fafb",
          colorBgRight: "#ffffff",
          colorBgFolder: "#f5f7f9",
          headerBgColor: "#FFFFFF",
          searchBgColor: "#f2f4f7",
          tableHeaderBgColor: "#f9fafb",
          searchBigBgColor: "#f2f4f7",
          searchBigSelectColor: "#ffffff",
          popoverSelectBgColor: "#ffffff",
          popoverSelectBgHoverColor: hexToRGBA(
            PRIMARY_COLOR_MAP[primaryColor],
            0.05,
          ),
          colorBgFolderHover: "#edeef2",
          colorDeepGray: "#e4e6ea",
          selectHoverColor: hexToRGBA(PRIMARY_COLOR_MAP[primaryColor], 0.05),
          formHoverColor: "#f9fafb",
          highlightChangeColor: "#ffffff",
          dividerColor: "#eef0f3",
          checkBoxBorderColor: "#e6e7e8",
          colorBorder: "#f2f4f6",
          colorHeaderBorder: "#f2f4f6",
          colorBorderLight: hexToRGBA("#eef0f3", 0.5),
          iconColor: "#a2a4a8",
          fontTitleColor: "#47494b",
          fontContentColor: hexToRGBA("#333639", 0.8),
          fontLightColor: hexToRGBA("#333639", 0.4),
          colorWhite: "#fff",
          boxShadowModalColor: "rgba(16, 24, 40, 0.06)",
          scrollbarThumbBgColor: "#eceff2",
          scrollbarThumbHoverBgColor: "#dcdfe2",
          modalContentBg: "#ffffff",
          modalMaskBg: hexToRGBA("#9198A6", 0.2),
        },
      };
  }
};
