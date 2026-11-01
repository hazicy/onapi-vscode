import type { EditorRecord } from "@onapi/domain/requests/record";
import * as vscode from "vscode";
import type { SidebarTreeNode } from "./tree-data";
import { handleMessage } from "./sidebar-handler";
import type { SidebarCommandContext } from "./command-context";
import { cloneDeep } from "lodash";
import { copyAsCurl } from "../requests/commands";
import { getApiListName } from "../requests/request-storage";
import { snowflakeId } from "@onapi/domain/utils/data-tools";
import { APIS_BASE_DEFAULT_DATA } from "@onapi/domain/requests/constants/common";
import { APIS_TARGET_TYPE_ENUM } from "@onapi/domain/requests/constants/index";

export function registerRequestCommands({
  context,
  command,
  selectedData,
  refresh,
  zh,
}: SidebarCommandContext) {
  command(
    "onapi.tree.open",
    (node: Extract<SidebarTreeNode, { kind: "request" }>) =>
      handleMessage(
        { action: "openTagPanelById", data: node.data.id },
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
      } as EditorRecord;
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
