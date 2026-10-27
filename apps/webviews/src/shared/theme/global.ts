import { useLayoutEffect } from "react";
import { useThemeConfig } from "@/shared/ui/base/Theme";
import "./global.css";

export default function GlobalThemeStyle() {
  const { token: themeToken } = useThemeConfig();
  useLayoutEffect(() => {
    const token = themeToken as GlobalThemeToken;
    const values = {
      "--color-primary-opacity": token.colorPrimaryOpacity,
      "--color-bg-gray": token.colorBgGray,
      "--color-font-light-hover": token.colorFontLightHover,
      "--color-bg-light-hover": token.colorBgLightHover,
      "--color-dashed": token.colorDashed,
      "--color-bg-page": token.colorBgPage,
      "--color-bg-right": token.colorBgRight,
      "--color-bg-folder": token.colorBgFolder,
      "--header-bg-color": token.headerBgColor,
      "--search-bg-color": token.searchBgColor,
      "--table-header-bg-color": token.tableHeaderBgColor,
      "--search-big-bg-color": token.searchBigBgColor,
      "--search-big-select-color": token.searchBigSelectColor,
      "--color-bg-folder-hover": token.colorBgFolderHover,
      "--color-deep-gray": token.colorDeepGray,
      "--select-hover-color": token.selectHoverColor,
      "--form-hover-color": token.formHoverColor,
      "--highlight-change-color": token.highlightChangeColor,
      "--divider-color": token.dividerColor,
      "--color-border": token.colorBorder,
      "--color-table-border": token.tableColorBorder,
      "--color-header-border": token.colorHeaderBorder,
      "--color-border-light": token.colorBorderLight,
      "--icon-color": token.iconColor,
      "--font-title-color": token.fontTitleColor,
      "--font-content-color": token.fontContentColor,
      "--font-light-color": token.fontLightColor,
      "--box-shadow-modal-color": token.boxShadowModalColor,
      "--line-height": token.lineHeight,
      "--border-radius": "var(--vscode-cornerRadius-small, 4px)",
      "--color-primary": token.colorPrimary,
      "--icon-primary-color": token.iconPrimaryColor,
      "--selected-border-color": token.SelectedBorderColor,
      "--white-color": token.WhiteColor,
      "--popover-select-bg-color": token.popoverSelectBgColor,
      "--popover-select-bg-hover-color": token.popoverSelectBgHoverColor,
      "--color-bg-tree-page": token.colorBgTreePage,
      "--color-white": token.colorWhite,
      "--check-box-border-color": token.checkBoxBorderColor,
      "--color-error-bg": token.colorErrorBg,
      "--color-success-bg": token.colorSuccessBg,
      "--color-warning-bg": token.colorWarningBg,
      "--color-info-bg": token.colorInfoBg,
      "--font-size-12": `${token.fontSize}px`,
      "--font-size-14": `${token.fontSize14}px`,
      "--font-size-16": `${token.fontSize / 0.75}px`,
      "--font-size-18": `${token.fontSize * 1.5}px`,
      "--font-size-20": `${token.fontSize / 0.6}px`,
      "--font-size-24": `${token.fontSize * 2}px`,
      "--padding8": `${token.padding8}px`,
      "--padding10": `${token.padding10}px`,
      "--padding12": `${token.padding12}px`,
      "--padding14": `${token.padding14}px`,
      "--padding16": `${token.padding16}px`,
      "--padding18": `${token.padding18}px`,
      "--padding20": `${token.padding20}px`,
      "--margin8": `${token.margin8}px`,
      "--margin10": `${token.margin10}px`,
      "--margin12": `${token.margin12}px`,
      "--margin14": `${token.margin14}px`,
      "--margin16": `${token.margin16}px`,
      "--margin18": `${token.margin18}px`,
      "--margin20": `${token.margin20}px`,
      "--scrollbar-thumb-bg-color": token.scrollbarThumbBgColor,
      "--scrollbar-thumb-hover-bg-color": token.scrollbarThumbHoverBgColor,
      "--modal-content-bg": token.modalContentBg,
      "--modal-mask-bg": token.modalMaskBg,
    };
    const root = document.documentElement;
    const previous = new Map<string, string>();
    for (const [name, value] of Object.entries(values)) {
      previous.set(name, root.style.getPropertyValue(name));
      if (value !== undefined && value !== null) {
        root.style.setProperty(name, String(value));
      }
    }
    return () => {
      for (const [name, value] of previous) {
        if (value) {
          root.style.setProperty(name, value);
        } else {
          root.style.removeProperty(name);
        }
      }
    };
  }, [themeToken]);
  return null;
}
