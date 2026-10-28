import * as vscode from "vscode";
import "./platform/locale/index";
import {
  createOpenPanel,
  createCurlPanel,
  createImportDataPanel,
  createEnvironmentPanel,
  createPushPanel,
  createFolderTestPanel,
  createfolderTestReportDataPanel,
  createExportDataPanel,
} from "./platform/webviews/panel-manager";
import { onThemeChange, onFontSizeChange } from "./platform/theme";
import { initializePlugin } from "./app/initialize";
import { restartServer, startDocsServer } from "./features/documentation";
import { createShareListPanel } from "./features/sharing/share-list-panel";
import { isNumber } from "lodash";
import { handleMessage } from "./features/sidebar/sidebar-handler";
import {
  DEFAULT_PROJECT,
  DEFAULT_TEAM_PROJECT,
} from "@onapi/domain/project/constants/project";
import { Project, TeamItem } from "@onapi/domain/auth/types/index";
import { randomUUID } from "node:crypto";
import { registerSidebarTree } from "./features/sidebar/register";

import { JsonRepository } from "./platform/storage/repository";
import { storageChanged } from "./platform/storage/events";
import { globalConfig } from "./app/config";
import { getCurrentProjectConfig } from "./platform/storage/project-config";
import { getApiList } from "./features/requests/request-storage";
let repository: JsonRepository | undefined;

export async function activate(context: vscode.ExtensionContext) {
  repository = new JsonRepository(context, () => {
    storageChanged.fire("apiList");
    if (repository?.error) {
      return;
    }
    const config = getCurrentProjectConfig(context);
    for (const panel of [
      ...Object.values(globalConfig.openedPanels || {}),
      globalConfig.environmentWebView,
    ]) {
      panel?.webview.postMessage({ action: "setProjectConfig", data: config });
      panel?.webview.postMessage({
        action: "externalStorageChanged",
        data: getApiList(context),
      });
    }
  });
  await repository.start();
  // Views must register even when local data cannot be loaded.
  registerSidebarTree(context);
  const recover = async () => {
    if (!repository?.error) {
      return;
    }
    const zh = vscode.env.language.startsWith("zh");
    const retry = zh ? "重试" : "Retry";
    const open = zh ? "打开存储目录" : "Open storage folder";
    const reset = zh ? "备份并重建" : "Back up and reset";
    const selected = await vscode.window.showErrorMessage(
      `${zh ? "本地数据加载失败" : "Local storage could not be loaded"}: ${repository.error}`,
      retry,
      open,
      reset,
    );
    if (selected === open) {
      await vscode.commands.executeCommand("revealFileInOS", repository.root);
    }
    if (selected === retry) {
      if (await repository.retry()) {
        await initializePlugin(context);
      }
    }
    if (selected === reset) {
      try {
        const backup = await repository.backupAndReset();
        if (repository.error) {
          throw new Error(repository.error);
        }
        await initializePlugin(context);
        void vscode.window.showInformationMessage(
          `${zh ? "存储已重建，原目录备份于" : "Storage reset; original data backed up to"}: ${backup.fsPath}`,
        );
      } catch (error) {
        void vscode.window.showErrorMessage(String(error));
      }
    }
  };
  context.subscriptions.push(
    vscode.commands.registerCommand("onapi.storage.recover", recover),
  );
  if (repository.error) {
    void recover();
  } else {
    try {
      await initializePlugin(context);
    } catch (error) {
      void vscode.window.showErrorMessage(String(error));
    }
  }

  // Read user's saved enableFeature configuration value
  const config = vscode.workspace.getConfiguration("onapi");
  const documentServicePort = config.get<number>("documentServicePort", 3000);

  // Start local document sharing service
  startDocsServer(context, documentServicePort);

  vscode.workspace.onDidChangeConfiguration((event) => {
    // Monitor theme changes
    if (event.affectsConfiguration("workbench.colorTheme")) {
      onThemeChange();
    }
    // Monitor font size changes
    if (
      event.affectsConfiguration("editor.fontSize") ||
      event.affectsConfiguration("editor.fontFamily")
    ) {
      onFontSizeChange(context);
    }
    // Monitor document service port changes
    if (event.affectsConfiguration("onapi.documentServicePort")) {
      const newConfig = vscode.workspace.getConfiguration("onapi");
      const newdocumentServicePort = newConfig.get<number>(
        "documentServicePort",
        3000,
      );
      if (isNumber(newdocumentServicePort)) {
        restartServer(context, newdocumentServicePort);
      }
    }
  });

  // Register editor Webview
  context.subscriptions.push(
    vscode.commands.registerCommand("onapi.switchWorkspace", async () => {
      const userConfig = context.globalState.get<any>("userConfig") || {};
      const zh = vscode.env.language.startsWith("zh");
      const teams: TeamItem[] = [
        DEFAULT_TEAM_PROJECT,
        ...(userConfig.teamProjectList || []),
      ];
      const items: (vscode.QuickPickItem & {
        team?: TeamItem;
        project?: Project;
      })[] = teams.flatMap((team) =>
        (team.project || []).map((project) => ({
          label: project.name,
          description: team.name,
          picked: project.project_id === userConfig.currentProject?.project_id,
          team,
          project,
        })),
      );
      items.unshift({
        label: zh ? "$(add) 新建工作区…" : "$(add) New Workspace…",
      });
      let selected = await vscode.window.showQuickPick(items, {
        title: zh ? "切换 Onapi 工作区" : "Switch Onapi Workspace",
        matchOnDescription: true,
      });
      if (!selected) {
        return;
      }
      if (!selected.project) {
        const name = await vscode.window.showInputBox({
          title: zh ? "新建 Onapi 工作区" : "New Onapi Workspace",
          prompt: zh ? "输入工作区名称" : "Enter a workspace name",
          ignoreFocusOut: true,
          validateInput: (value) => {
            if (!value.trim()) {
              return zh ? "请输入工作区名称" : "Enter a workspace name";
            }
            if (
              items.some(
                (item) =>
                  item.project?.name.toLowerCase() ===
                  value.trim().toLowerCase(),
              )
            ) {
              return zh
                ? "工作区名称已存在"
                : "A workspace with this name already exists";
            }
            return undefined;
          },
        });
        if (!name?.trim()) {
          return;
        }
        const project: Project = {
          ...DEFAULT_PROJECT,
          project_id: randomUUID(),
          team_id: DEFAULT_TEAM_PROJECT.team_id,
          name: name.trim(),
          is_default: 0,
          created_at: new Date(),
          edited_at: new Date(),
        };
        const team: TeamItem = { ...DEFAULT_TEAM_PROJECT, project: [project] };
        const teamProjectList: TeamItem[] = [
          ...(userConfig.teamProjectList || []),
        ];
        const existingTeam = teamProjectList.find(
          (item) => item.team_id === team.team_id,
        );
        if (existingTeam) {
          existingTeam.project = [...(existingTeam.project || []), project];
        } else {
          teamProjectList.push(team);
        }
        await context.globalState.update("userConfig", {
          ...userConfig,
          teamProjectList,
        });
        selected = { label: project.name, team: existingTeam || team, project };
      }
      if (
        selected.project?.project_id === userConfig.currentProject?.project_id
      ) {
        return;
      }
      await handleMessage({ action: "switchProject", data: selected }, context);
    }),
  );

  // Register editor Webview
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "openTabPanel",
      (data, openHandledAt?: number) => {
        createOpenPanel(data, context, openHandledAt);
      },
    ),
  );

  // Register curl import Webview
  context.subscriptions.push(
    vscode.commands.registerCommand("openCurlPanel", (data) => {
      createCurlPanel(data, context);
    }),
  );

  // Register Import Data Webview
  context.subscriptions.push(
    vscode.commands.registerCommand("openImportDataPanel", (data) => {
      createImportDataPanel(data ?? { type: "curl" }, context);
    }),
  );

  // Register Export Data Webview
  context.subscriptions.push(
    vscode.commands.registerCommand("openExportDataPanel", (data) => {
      createExportDataPanel(data ?? { type: "onapi" }, context);
    }),
  );

  // Register global environment Webview
  context.subscriptions.push(
    vscode.commands.registerCommand("onapi.openEnv", (data) => {
      createEnvironmentPanel(data, context);
    }),
  );

  // Register push page Webview
  context.subscriptions.push(
    vscode.commands.registerCommand("onapi.openPush", (data) => {
      createPushPanel(data, context);
    }),
  );

  // Share list page
  context.subscriptions.push(
    vscode.commands.registerCommand("onapi.shareList", (data) => {
      createShareListPanel(data, context);
    }),
  );

  // Folder test page
  context.subscriptions.push(
    vscode.commands.registerCommand("onapi.folderTest", (data, option) => {
      createFolderTestPanel(data, context, option);
    }),
  );

  // Folder test page
  context.subscriptions.push(
    vscode.commands.registerCommand("onapi.folderTestReportData", (data) => {
      createfolderTestReportDataPanel(data, context);
    }),
  );

  // Contact us
  context.subscriptions.push(
    vscode.commands.registerCommand("onapi.openExtenisonSettings", (data) => {
      // Jump directly to plugin settings page
      vscode.commands.executeCommand(
        "workbench.action.openSettings",
        `@ext:${context.extension.id}`,
      );
    }),
  );
}

// This method is called when your extension is deactivated
export function deactivate() {
  return repository?.flush();
}
