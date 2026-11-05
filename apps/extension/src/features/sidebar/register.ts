import * as vscode from "vscode";
import {
  requestDecoration,
  requestStatusChanged,
} from "../requests/request-status";
import { getCurrentProjectConfig } from "../../platform/storage/project-config";
import { getApiListName } from "../requests/request-storage";
import { storageChanged } from "../../platform/storage/events";
import { SidebarTreeProvider } from "./tree-provider";
import { RequestTreeDragController } from "./tree-drag";
import { createSidebarCommandContext } from "./command-context";
import { registerRequestCommands } from "./request-commands";
import { registerTestCommands } from "./test-commands";
import { registerShareCommands } from "./share-commands";

export function registerSidebarTree(context: vscode.ExtensionContext) {
  const zh = vscode.env.language.startsWith("zh");
  const requestsProvider = new SidebarTreeProvider(context, "requests");
  const testsProvider = new SidebarTreeProvider(context, "tests");
  const historyProvider = new SidebarTreeProvider(context, "history");
  const providers = [requestsProvider, testsProvider, historyProvider];
  const refresh = () => providers.forEach((provider) => provider.refresh());
  const list = requestsProvider.list;
  const view = vscode.window.createTreeView("onapiRequests", {
    treeDataProvider: requestsProvider,
    showCollapseAll: true,
    canSelectMany: true,
    dragAndDropController: new RequestTreeDragController(
      context,
      requestsProvider,
    ),
  });
  const testsView = vscode.window.createTreeView("onapiTests", {
    treeDataProvider: testsProvider,
    showCollapseAll: true,
  });
  const historyView = vscode.window.createTreeView("onapiHistory", {
    treeDataProvider: historyProvider,
    showCollapseAll: true,
  });
  for (const treeView of [view, testsView, historyView]) {
    context.subscriptions.push(
      treeView.onDidChangeVisibility(({ visible }) => {
        if (visible) {
          // Reapply the message through the public API to lay out a newly created
          // native list. Its initial viewport can remain 0x0 until the delayed
          // activation update, even though the tree model already contains data.
          treeView.message = treeView.message ?? "";
        }
      }),
    );
  }
  const decorationsChanged = new vscode.EventEmitter<
    vscode.Uri | vscode.Uri[] | undefined
  >();
  context.subscriptions.push(
    decorationsChanged,
    vscode.window.registerFileDecorationProvider({
      onDidChangeFileDecorations: decorationsChanged.event,
      provideFileDecoration(uri) {
        if (uri.scheme !== "onapi-request" || uri.authority !== "status") {
          return;
        }
        const [, workspace, id] = uri.path.split("/");
        if (workspace !== encodeURIComponent(getApiListName(context))) {
          return;
        }
        const rows = list();
        const data = rows.find((row) => encodeURIComponent(row.id) === id);
        if (!data) {
          return;
        }
        const status = requestDecoration(
          getApiListName(context),
          data,
          getCurrentProjectConfig(context),
          rows,
        );
        return status
          ? {
              badge: status.badge,
              propagate: false,
            }
          : undefined;
      },
    }),
    requestStatusChanged.event(({ workspace, id }) => {
      if (workspace !== getApiListName(context)) {
        return;
      }
      requestsProvider.refreshRequest(id);
      decorationsChanged.fire(
        vscode.Uri.from({
          scheme: "onapi-request",
          authority: "status",
          path: `/${encodeURIComponent(workspace)}/${encodeURIComponent(id)}`,
        }),
      );
    }),
    storageChanged.event(() => decorationsChanged.fire(undefined)),
    view,
    testsView,
    historyView,
    ...providers,
    storageChanged.event((key) => {
      if (
        key === "apiList" ||
        key.startsWith("apiList:") ||
        key.endsWith(":test") ||
        key === "userConfig"
      ) {
        refresh();
      }
    }),
  );
  const commands = createSidebarCommandContext(context, list, refresh);
  registerRequestCommands(commands);
  registerTestCommands(commands);
  registerShareCommands(commands);
  const { command } = commands;
  command("onapi.tree.refresh", () => refresh());
  command("onapi.tree.filter", async () => {
    const value = await vscode.window.showInputBox({
      title: zh ? "筛选接口和历史" : "Filter Requests and History",
      prompt: zh
        ? "按名称、URL 或方法筛选；清空显示全部"
        : "Filter by name, URL or method; clear to show all",
      value: requestsProvider.filterText,
    });
    if (value === undefined) {
      return;
    }
    providers.forEach((provider) => provider.setFilter(value));
    view.message = requestsProvider.filterText
      ? `${zh ? "筛选" : "Filter"}: ${value}`
      : undefined;
    historyView.message = view.message;
  });
}
