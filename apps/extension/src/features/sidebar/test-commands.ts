import * as vscode from "vscode";
import type { SidebarTreeNode } from "./tree-data";
import { handleMessage } from "./sidebar-handler";
import type { SidebarCommandContext } from "./command-context";

export function registerTestCommands({
  context,
  command,
  list,
  selectedData,
  zh,
}: SidebarCommandContext) {
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
  command("onapi.tree.folderReports", (node?: SidebarTreeNode) => {
    const data = selectedData(node);
    if (data?.kind !== "folder") {
      return;
    }
    return vscode.commands.executeCommand("onapi.folderTest", data, {
      openHistoryReport: true,
    });
  });
}
