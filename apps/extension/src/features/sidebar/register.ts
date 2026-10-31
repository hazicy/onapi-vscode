import { getDocumentItems } from "../sharing/document-items";
import {
  createShare,
  getDocBaseUrl,
  getProjectShareData,
} from "../sharing/share-data";
import { globalConfig } from "../../app/config";
import {
  requestDecoration,
  requestStatusChanged,
} from "../requests/request-status";
import { getCurrentProjectConfig } from "../../platform/storage/project-config";
import { copyAsCurl } from "../requests/commands";
import * as vscode from "vscode";
import { snowflakeId } from "@onapi/domain/utils/data-tools";
import { cloneDeep } from "lodash";
import { getApiListName } from "../requests/request-storage";
import { storageChanged } from "../../platform/storage/events";
import type { SidebarTreeNode } from "./tree-data";
import { SidebarTreeProvider } from "./tree-provider";
import { RequestTreeDragController } from "./tree-drag";
import { handleMessage } from "./sidebar-handler";
import { APIS_BASE_DEFAULT_DATA } from "@onapi/domain/requests/constants/common";
import { APIS_TARGET_TYPE_ENUM } from "@onapi/domain/requests/constants/index";
import type { ApiDetailsData } from "@onapi/domain/requests/types/api";

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
              color: status.color
                ? new vscode.ThemeColor(status.color)
                : undefined,
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
  const command = (id: string, callback: (...args: any[]) => any) =>
    context.subscriptions.push(vscode.commands.registerCommand(id, callback));
  command(
    "onapi.tree.open",
    (node: Extract<SidebarTreeNode, { kind: "request" }>) =>
      handleMessage(
        { action: "openTagPanelById", data: node.data.id },
        context,
      ),
  );
  command(
    "onapi.tree.runTests",
    async (node?: Extract<SidebarTreeNode, { kind: "testFolder" }>) => {
      let data = node?.data;
      if (!data) {
        const folders = list().filter((item) => item.kind === "folder");
        if (!folders.length) {
          await vscode.window.showInformationMessage(
            zh
              ? "请先在接口中创建目录并添加请求。"
              : "Create a request folder and add requests first.",
          );
          return;
        }
        const selected = await vscode.window.showQuickPick(
          folders.map((data) => ({ label: data.name, data })),
          { title: zh ? "选择测试目录" : "Select Test Folder" },
        );
        data = selected?.data;
      }
      if (data) {
        await vscode.commands.executeCommand("onapi.folderTest", data);
      }
    },
  );
  command(
    "onapi.tree.openReport",
    (node: Extract<SidebarTreeNode, { kind: "report" }>) =>
      vscode.commands.executeCommand("onapi.folderTestReportData", node.data),
  );
  command(
    "onapi.tree.deleteReport",
    (node: Extract<SidebarTreeNode, { kind: "report" }>) =>
      handleMessage(
        { action: "deleteReport", data: { report_id: node.data.report_id } },
        context,
      ),
  );
  command(
    "onapi.tree.openHistory",
    (node: Extract<SidebarTreeNode, { kind: "history" }>) => {
      const request = node.data.request;
      const data = {
        ...cloneDeep(APIS_BASE_DEFAULT_DATA[request.kind]),
        ...cloneDeep(request),
        id: `history-${node.data.id}`,
      };
      return vscode.commands.executeCommand("openTabPanel", data);
    },
  );
  const selectedData = (node?: SidebarTreeNode) => {
    if (!node || (node.kind !== "request" && node.kind !== "testFolder")) {
      return;
    }
    return list().find((item) => item.id === node.data.id);
  };
  command("onapi.tree.rename", async (node?: SidebarTreeNode) => {
    const data = selectedData(node);
    if (!data) {
      return;
    }
    const projectKey = getApiListName(context);
    const name = await vscode.window.showInputBox({
      title: zh ? "重命名" : "Rename",
      value: data.name,
      validateInput: (value) =>
        value.trim() ? undefined : zh ? "请输入名称" : "Enter a name",
    });
    if (
      !name?.trim() ||
      name.trim() === data.name ||
      getApiListName(context) !== projectKey
    ) {
      return;
    }
    // Read again after the prompt so concurrent edits are preserved.
    const current = selectedData(node);
    if (!current) {
      return;
    }
    await handleMessage(
      {
        action: "saveFolder",
        data: { ...cloneDeep(current), name: name.trim() },
      },
      context,
    );
    refresh();
  });
  command("onapi.tree.clone", async (node?: SidebarTreeNode) => {
    const data = selectedData(node);
    if (!data || data.kind === "folder") {
      return;
    }
    await handleMessage({ action: "cloneApi", data: { id: data.id } }, context);
    refresh();
  });
  command("onapi.tree.delete", async (node?: SidebarTreeNode) => {
    const data = selectedData(node);
    if (!data) {
      return;
    }
    await handleMessage(
      {
        action: "showConfirmation",
        data: {
          id: data.id,
          title: zh
            ? `确定删除“${data.name}”${data.kind === "folder" ? "及其所有内容" : ""}？`
            : `Delete "${data.name}"${data.kind === "folder" ? " and all its contents" : ""}?`,
        },
      },
      context,
    );
    refresh();
  });
  command("onapi.tree.copyCurl", async (node?: SidebarTreeNode) => {
    const data = selectedData(node);
    if (!data || !["api", "graphql"].includes(data.kind)) {
      return;
    }
    await copyAsCurl({ ...cloneDeep(data), parentId: "0" }, context);
  });
  command("onapi.tree.shareDocs", async (node?: SidebarTreeNode) => {
    const data = selectedData(node);
    if (!data || !["folder", "api", "graphql"].includes(data.kind)) {
      return;
    }
    if (
      !getDocumentItems(list(), data).some((item) => item.kind !== "folder")
    ) {
      await vscode.window.showInformationMessage(
        zh
          ? "此目录没有可分享的 HTTP 或 GraphQL 请求。"
          : "This folder has no HTTP or GraphQL requests to share.",
      );
      return;
    }
    const baseUrl = getDocBaseUrl(context);
    if (typeof baseUrl !== "string" || !baseUrl.startsWith("http://")) {
      await vscode.window.showErrorMessage(
        zh
          ? "文档服务尚未就绪，请稍后重试。"
          : "The documentation service is not ready. Try again shortly.",
      );
      return;
    }
    const saved = await createShare(
      { id: data.id, share_time: Date.now() },
      context,
    );
    if (!saved) {
      await vscode.window.showErrorMessage(
        zh ? "无法保存文档分享。" : "Could not save the document share.",
      );
      return;
    }
    globalConfig.shareListWebView?.webview.postMessage({
      action: "setShareData",
      data: getProjectShareData(context),
    });
    const url = `${baseUrl}?share_id=${encodeURIComponent(data.id)}`;
    await vscode.env.clipboard.writeText(url);
    const open = zh ? "打开文档" : "Open Documentation";
    const selected = await vscode.window.showInformationMessage(
      zh ? "接口文档分享链接已复制。" : "API documentation link copied.",
      open,
    );
    if (selected === open) {
      await vscode.env.openExternal(vscode.Uri.parse(url));
    }
  });
  command("onapi.tree.revealStorage", (node?: SidebarTreeNode) => {
    if (!selectedData(node)) {
      return;
    }
    return handleMessage(
      { action: "openVscodeFileExplorer", data: undefined },
      context,
    );
  });
  command("onapi.tree.folderSettings", (node?: SidebarTreeNode) => {
    const data = selectedData(node);
    if (data?.kind !== "folder") {
      return;
    }
    return handleMessage(
      { action: "openTagPanelById", data: data.id },
      context,
    );
  });
  command("onapi.tree.folderReports", (node?: SidebarTreeNode) => {
    const data = selectedData(node);
    if (data?.kind !== "folder") {
      return;
    }
    return vscode.commands.executeCommand("onapi.folderTest", data, {
      openHistoryReport: true,
    });
  });
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
  for (const type of [
    "api",
    "graphql",
    "websocket",
    "socketio",
    "ai",
    "mcp",
    "grpc",
    "folder",
  ]) {
    command(`onapi.tree.new.${type}`, (node?: SidebarTreeNode) =>
      vscode.commands.executeCommand("onapi.tree.new", node, type),
    );
  }
  command(
    "onapi.tree.new",
    async (node?: SidebarTreeNode, targetType?: string) => {
      const parent =
        node && (node.kind === "request" || node.kind === "testFolder")
          ? node.data
          : undefined;
      const types: APIS_TARGET_TYPE_ENUM[] = [
        APIS_TARGET_TYPE_ENUM.API,
        APIS_TARGET_TYPE_ENUM.GRAPHQL,
        APIS_TARGET_TYPE_ENUM.WEBSOCKET,
        APIS_TARGET_TYPE_ENUM.SOCKETIO,
        APIS_TARGET_TYPE_ENUM.AI,
        APIS_TARGET_TYPE_ENUM.MCP,
        APIS_TARGET_TYPE_ENUM.GRPC,
        APIS_TARGET_TYPE_ENUM.FOLDER,
      ];
      const type =
        targetType && types.includes(targetType as APIS_TARGET_TYPE_ENUM)
          ? { type: targetType }
          : await vscode.window.showQuickPick<
              vscode.QuickPickItem & { type?: string }
            >(
              [
                {
                  label: "$(onapi-http) HTTP",
                  type: APIS_TARGET_TYPE_ENUM.API,
                },
                {
                  label: "$(onapi-graphql) GraphQL",
                  type: APIS_TARGET_TYPE_ENUM.GRAPHQL,
                },
                {
                  label: "$(onapi-websocket) WebSocket",
                  type: APIS_TARGET_TYPE_ENUM.WEBSOCKET,
                },
                {
                  label: "$(onapi-socketio) Socket.IO",
                  type: APIS_TARGET_TYPE_ENUM.SOCKETIO,
                },
                { label: "$(onapi-ai) AI", type: "ai" },
                { label: "$(onapi-mcp) MCP", type: "mcp" },
                { label: "$(onapi-grpc) gRPC", type: "grpc" },
                { label: "", kind: vscode.QuickPickItemKind.Separator },
                {
                  label: `$(onapi-folder) ${zh ? "目录" : "Folder"}`,
                  type: APIS_TARGET_TYPE_ENUM.FOLDER,
                },
              ],
              { title: zh ? "新建" : "New" },
            );
      if (!type?.type) {
        return;
      }
      const name = await vscode.window.showInputBox({
        title: zh ? "名称" : "Name",
        value:
          type.type === "folder"
            ? zh
              ? "新建目录"
              : "New Folder"
            : zh
              ? "新建接口"
              : "New Request",
        validateInput: (value) =>
          value.trim() ? undefined : zh ? "请输入名称" : "Enter a name",
      });
      if (!name?.trim()) {
        return;
      }
      const data = {
        ...cloneDeep(
          APIS_BASE_DEFAULT_DATA[
            type.type as keyof typeof APIS_BASE_DEFAULT_DATA
          ],
        ),
        kind: type.type,
        id: snowflakeId(),
        name: name.trim(),
        parentId: parent?.kind === "folder" ? parent.id : "0",
      } as ApiDetailsData;
      const saved = await handleMessage(
        { action: "saveFolder", data },
        context,
      );
      if (saved === false) {
        return;
      }
      if (type.type !== "folder") {
        await vscode.commands.executeCommand("openTabPanel", data);
      }
      refresh();
    },
  );
}
