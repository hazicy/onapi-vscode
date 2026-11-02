import { homedir } from "node:os";
import * as vscode from "vscode";
import type { EnvironmentScope } from "@onapi/domain";
import {
  getCurrentProjectConfig,
  getProjectWorkspace,
  getProjectConfig,
  updateProjectConfig,
} from "../../platform/storage/project-config";
import { getStorageError } from "../../platform/storage";
import { storageChanged } from "../../platform/storage/events";
import { createEnvironmentPanel } from "./environment-panel";
import { createImportDataPanel } from "../import/import-data-panel";

export class EnvironmentTreeProvider
  implements vscode.TreeDataProvider<EnvironmentScope>, vscode.Disposable
{
  private readonly changed = new vscode.EventEmitter<
    EnvironmentScope | undefined
  >();
  readonly onDidChangeTreeData = this.changed.event;
  private readonly zh = vscode.env.language.startsWith("zh");
  constructor(private readonly context: vscode.ExtensionContext) {}
  refresh() {
    this.changed.fire(undefined);
  }
  dispose() {
    this.changed.dispose();
  }
  getChildren(parent?: EnvironmentScope): EnvironmentScope[] {
    if (parent || getStorageError(this.context)) {
      return [];
    }
    return getCurrentProjectConfig(this.context).http?.environments ?? [];
  }
  getTreeItem(environment: EnvironmentScope) {
    const active =
      getCurrentProjectConfig(this.context).http?.activeEnvironment ===
      environment.id;
    const item = new vscode.TreeItem(
      environment.name || (this.zh ? "未命名环境" : "Unnamed environment"),
      vscode.TreeItemCollapsibleState.None,
    );
    item.id = environment.id;
    item.contextValue = active ? "onapiEnvironmentActive" : "onapiEnvironment";
    item.iconPath = new vscode.ThemeIcon(active ? "check" : "symbol-variable");
    item.description = active ? (this.zh ? "当前" : "Active") : undefined;
    item.tooltip = `${environment.name}\n${this.zh ? "工作区环境 · 单击编辑，右键设为当前环境" : "Workspace environment · Click to edit, right-click to activate"}`;
    item.command = {
      command: "onapi.environment.edit",
      title: this.zh ? "编辑环境" : "Edit Environment",
      arguments: [environment],
    };
    return item;
  }
}

export function registerEnvironmentTree(context: vscode.ExtensionContext) {
  const zh = vscode.env.language.startsWith("zh");
  const provider = new EnvironmentTreeProvider(context);
  const view = vscode.window.createTreeView("onapiEnvironments", {
    treeDataProvider: provider,
  });
  const refresh = () => {
    provider.refresh();
    if (getStorageError(context)) {
      view.description = undefined;
      view.message = zh
        ? "环境存储不可用，请先恢复存储"
        : "Environment storage unavailable. Recover storage first.";
      return;
    }
    const http = getCurrentProjectConfig(context).http ?? {
      environments: [],
      activeEnvironment: "",
    };
    const active = http.environments.find(
      (environment) => environment.id === http.activeEnvironment,
    );
    view.description = active?.name || (zh ? "未选择环境" : "No environment");
    view.message = http.environments.length
      ? undefined
      : zh
        ? "暂无环境，点击 + 新建"
        : "No environments. Use + to create one.";
  };
  const command = (id: string, run: (...args: any[]) => unknown) =>
    context.subscriptions.push(vscode.commands.registerCommand(id, run));
  context.subscriptions.push(
    provider,
    view,
    storageChanged.event((key) => {
      if (
        key === "userConfig" ||
        key === "apiList" ||
        key.startsWith("projectConfig_")
      ) {
        refresh();
      }
    }),
  );
  command("onapi.environment.refresh", refresh);
  command("onapi.environment.edit", (environment: EnvironmentScope) => {
    const current = provider
      .getChildren()
      .find((item) => item.id === environment?.id);
    if (current) {
      createEnvironmentPanel({ id: current.id, env_id: current.id }, context);
    }
  });
  command("onapi.environment.create", () =>
    createEnvironmentPanel({ create: true }, context),
  );
  command(
    "onapi.environment.activate",
    async (environment: EnvironmentScope) => {
      const workspace = getProjectWorkspace(context);
      const config = getProjectConfig(context, workspace);
      if (
        !config.http?.environments.some((item) => item.id === environment?.id)
      ) {
        return;
      }
      if (
        !(await updateProjectConfig(context, workspace, (latest) => {
          if (
            !latest.http?.environments.some(
              (item) => item.id === environment.id,
            )
          ) {
            throw new Error("Environment no longer exists");
          }
          return {
            ...latest,
            http: { ...latest.http, activeEnvironment: environment.id },
          };
        }))
      ) {
        void vscode.window.showErrorMessage(
          zh
            ? "环境切换失败，请重试"
            : "Failed to switch environment. Please retry.",
        );
      }
      refresh();
    },
  );
  command("onapi.environment.import", () =>
    createImportDataPanel({ type: "postman" }, context),
  );
  command(
    "onapi.environment.export",
    async (environment?: EnvironmentScope) => {
      const environments = provider.getChildren();
      const selected = environment
        ? environments.find((item) => item.id === environment.id)
        : (
            await vscode.window.showQuickPick(
              environments.map((item) => ({
                label: item.name,
                environment: item,
              })),
              { title: zh ? "导出环境" : "Export Environment" },
            )
          )?.environment;
      if (!selected) {
        return;
      }
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.joinPath(
          vscode.workspace.workspaceFolders?.[0]?.uri ??
            vscode.Uri.file(homedir()),
          `${selected.name.replace(/[^\p{L}\p{N}._-]/gu, "_") || "environment"}.postman_environment.json`,
        ),
        filters: { JSON: ["json"] },
        title: zh ? "导出 Postman 环境" : "Export Postman Environment",
      });
      if (!uri) {
        return;
      }
      try {
        await vscode.workspace.fs.writeFile(
          uri,
          Buffer.from(
            JSON.stringify(
              { ...selected, _postman_variable_scope: "environment" },
              null,
              2,
            ) + "\n",
          ),
        );
      } catch {
        void vscode.window.showErrorMessage(
          zh
            ? "导出环境失败，请检查保存位置后重试"
            : "Failed to export environment. Check the destination and retry.",
        );
      }
    },
  );
  refresh();
}
