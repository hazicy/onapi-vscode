import * as vscode from "vscode";
import i18next from "i18next";
interface GlobalConfigType {
  openedPanels: { [key: string]: vscode.WebviewPanel };
  openedFolderTestPanels: { [key: string]: vscode.WebviewPanel };
  openedFolderTestReportDataPanels: { [key: string]: vscode.WebviewPanel };
  environmentWebView: vscode.WebviewPanel | null;
  importDataWebView: vscode.WebviewPanel | null;
  exportDataWebView: vscode.WebviewPanel | null;
  shareListWebView: vscode.WebviewPanel | null;
}

enum PanelNameEnum {
  EXPORTDATA = "EXPORTDATA",
  IMPORTDATA = "IMPORTDATA",
  SHARELIST = "SHARELIST",
  ENVIRONMENT = "ENVIRONMENT",
  FOLDER_TEST_REPORT = "FOLDER_TEST_REPORT",
  FOLDER_TEST = "FOLDER_TEST",
  OPEN = "OPEN",
}

type PanelOptionsType = {
  [name in PanelNameEnum]: {
    viewType: string;
    title: string;
    iconName: string;
    iconObj?: any;
  };
};

export const globalConfig: GlobalConfigType = {
  // Global store for open tabs
  openedPanels: {},

  // Global store for open folder test pages
  openedFolderTestPanels: {},

  // Global store for open folder report detail pages
  openedFolderTestReportDataPanels: {},

  // Global parameters webview object
  environmentWebView: null,
  // Share list webview object
  shareListWebView: null,

  // Import data webview object
  importDataWebView: null,

  exportDataWebView: null,
  // Global store for open document pages
};

export const DEFAULT_TARGET_NAME: any = {
  api: "HTTP Request",
  sse: "SSE Request",
  folder: "Folder",
  websocket: "WebSocket Client",
  socketio: "Socket.IO Client",
  graphql: "GraphQL Request",
};

export const PANEL_OPTIONS: PanelOptionsType = {
  [PanelNameEnum.EXPORTDATA]: {
    viewType: "exportDataPanel",
    title: i18next.t("settings.export_project.title"),
    iconName: "export_data.png",
  },
  [PanelNameEnum.IMPORTDATA]: {
    viewType: "importDataPanel",
    title: i18next.t("common.import_project"),
    iconName: "import_data.png",
  },
  [PanelNameEnum.SHARELIST]: {
    viewType: "shareListPanel",
    title: i18next.t("docs.share_modal.share_list"),
    iconName: "share_list.png",
  },
  [PanelNameEnum.ENVIRONMENT]: {
    viewType: "environmentPanel",
    title: i18next.t("common.env_title"),
    iconName: "setting.png",
  },
  [PanelNameEnum.FOLDER_TEST_REPORT]: {
    viewType: "folderTestReportPanel",
    title: i18next.t("common.kind.test_report"),
    iconName: "test.png",
  },
  [PanelNameEnum.FOLDER_TEST]: {
    viewType: "folderTestPanel",
    title: "Test",
    iconName: "test.png",
  },
  [PanelNameEnum.OPEN]: {
    viewType: "tagPanel",
    title: "New Request",
    iconName: "",
    iconObj: {
      sse: "sse.png",
      api: "http.svg",
      websocket: "websocket.png",
      socketio: "socketio.png",
      graphql: "graphql.png",
    },
  },
};

export const LOCAL_PORT = "8080";
