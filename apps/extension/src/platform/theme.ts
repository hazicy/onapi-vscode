import { forEach, isFunction, isPlainObject } from "lodash";
import * as vscode from "vscode";
import { globalConfig } from "../app/config";
import { getVscodeFontSize, getVscodeFontFamily } from "./host-utils";

export const onThemeChange = () => {
  const {
    openedPanels,
    environmentWebView,
    openedFolderTestPanels,
    exportDataWebView,
    importDataWebView,
  } = globalConfig;
  const currentTheme = vscode.workspace
    .getConfiguration("workbench")
    .get("colorTheme");

  // Notify tabs
  forEach(openedPanels, (openedPanel, key) => {
    openedPanel.webview.postMessage({
      action: "setVscodeTheme",
      data: currentTheme,
    });
  });
  // Notify global environment page
  environmentWebView &&
    environmentWebView.webview.postMessage({
      action: "setVscodeTheme",
      data: currentTheme,
    });

  // Notify open run folder
  forEach(openedFolderTestPanels, (openedPanel, key) => {
    openedPanel.webview.postMessage({
      action: "setVscodeTheme",
      data: currentTheme,
    });
  });

  // Notify export
  exportDataWebView?.webview.postMessage({
    action: "setVscodeTheme",
    data: currentTheme,
  });

  // Notify import
  importDataWebView?.webview.postMessage({
    action: "setVscodeTheme",
    data: currentTheme,
  });
};

export const onFontSizeChange = (context: vscode.ExtensionContext) => {
  try {
    let font_size = getVscodeFontSize();
    let font_family = getVscodeFontFamily();
    // Local stored data collection
    let default_system_config: any =
      context.globalState.get("systemConfig") || {};
    default_system_config.font_size = font_size;
    default_system_config.font_family = font_family;
    context.globalState.update("systemConfig", default_system_config);

    // Notify all tab pages
    forEach(globalConfig, (panel: any, key) => {
      // Multi-tab
      if (isPlainObject(panel)) {
        forEach(panel, (openPanel) => {
          if (isFunction(openPanel?.webview?.postMessage)) {
            openPanel.webview.postMessage({
              action: "setSystemConfig",
              data: { font_size, font_family },
            });
          }
        });
      } else {
        if (isFunction(panel?.webview?.postMessage)) {
          panel.webview.postMessage({
            action: "setSystemConfig",
            data: { font_size, font_family },
          });
        }
      }
    });
  } catch (error) {}
};
