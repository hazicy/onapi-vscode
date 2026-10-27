import { getStorageError } from "../../platform/storage";
import * as vscode from "vscode";
import { isHttpCollectionItem, requestUrl, requestMethod } from "@onapi/domain";
import type { ApiDetailsData } from "@onapi/domain/requests/types/api";
import { getApiList } from "../requests/request-storage";
import { getProjectReportList } from "../testing/report-storage";
import { getRequestHistory } from "../requests/request-history";
import {
  dayKey,
  requestChildren,
  type SidebarTreeSection,
  type SidebarTreeNode,
} from "./tree-data";
import {
  RequestTreeItem,
  TestFolderTreeItem,
  ReportsTreeItem,
  ReportTreeItem,
  HistoryDayTreeItem,
  HistoryTreeItem,
  EmptyTreeItem,
} from "./tree-items";

export class SidebarTreeProvider
  implements vscode.TreeDataProvider<SidebarTreeNode>, vscode.Disposable
{
  private readonly changed = new vscode.EventEmitter<
    SidebarTreeNode | undefined
  >();
  readonly onDidChangeTreeData = this.changed.event;
  private readonly zh = vscode.env.language.startsWith("zh");
  private filter = "";

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly section: SidebarTreeSection,
  ) {}

  get filterText(): string {
    return this.filter;
  }
  setFilter(value: string): void {
    this.filter = value.trim().toLowerCase();
    this.refresh();
  }
  refresh(): void {
    this.changed.fire(undefined);
  }
  dispose(): void {
    this.changed.dispose();
  }

  readonly list = (): ApiDetailsData[] => getApiList(this.context);
  private readonly matches = (
    data: Pick<ApiDetailsData, "name" | "url" | "method"> & {
      kind: string;
    },
  ) =>
    `${data.name} ${isHttpCollectionItem(data) ? requestUrl(data) : data.url || ""} ${isHttpCollectionItem(data) ? requestMethod(data) : data.method || ""}`
      .toLowerCase()
      .includes(this.filter);
  private readonly history = () =>
    getRequestHistory(this.context).filter((entry) =>
      this.matches(entry.request),
    );
  private readonly children = (parent?: ApiDetailsData, foldersOnly = false) =>
    requestChildren(
      this.list(),
      parent,
      foldersOnly ? "" : this.filter,
      foldersOnly,
    );
  private readonly empty = (label: string, id: string): SidebarTreeNode[] => [
    { kind: "empty", label, id },
  ];

  getTreeItem(node: SidebarTreeNode): vscode.TreeItem {
    switch (node.kind) {
      case "request":
        return new RequestTreeItem(node, this.context, this.list);
      case "testFolder":
        return new TestFolderTreeItem(
          node,
          this.context,
          this.list,
          this.zh,
          this.children(node.data, true).length > 0,
        );
      case "reports":
        return new ReportsTreeItem(
          this.context,
          this.zh,
          getProjectReportList(this.context).length,
        );
      case "report":
        return new ReportTreeItem(node, this.zh);
      case "day":
        return new HistoryDayTreeItem(
          node,
          this.context,
          this.history().filter((entry) => dayKey(entry.sentAt) === node.day)
            .length,
        );
      case "history":
        return new HistoryTreeItem(node, this.context, this.list);
      case "empty":
        return new EmptyTreeItem(node);
    }
  }
  getChildren(node?: SidebarTreeNode): SidebarTreeNode[] {
    if (!node) {
      const error = getStorageError(this.context);
      if (error) {
        return this.empty(
          `${this.zh ? "存储加载失败，点击处理" : "Storage unavailable — click to recover"}: ${error}`,
          "storage:error",
        );
      }
      if (this.section === "requests") {
        const rows = this.children().map((data) => ({
          kind: "request" as const,
          data,
        }));
        return rows.length
          ? rows
          : this.empty(
              this.zh
                ? "暂无接口，点击 + 新建"
                : "No requests. Use + to create one.",
              "empty:requests",
            );
      }
      if (this.section === "tests") {
        return [
          ...this.children(undefined, true).map((data) => ({
            kind: "testFolder" as const,
            data,
          })),
          { kind: "reports" },
        ];
      }
      const days = [
        ...new Set(this.history().map((entry) => dayKey(entry.sentAt))),
      ];
      return days.length
        ? days.map((day) => ({ kind: "day", day }))
        : this.empty(
            this.zh
              ? "发送请求后会显示在这里"
              : "Sent requests will appear here.",
            "empty:history",
          );
    }
    if (node.kind === "request") {
      return this.children(node.data).map((data) => ({
        kind: "request",
        data,
      }));
    }
    if (node.kind === "testFolder") {
      return this.children(node.data, true).map((data) => ({
        kind: "testFolder",
        data,
      }));
    }
    if (node.kind === "reports") {
      const reports = getProjectReportList(this.context);
      return reports.length
        ? reports.map((data) => ({ kind: "report", data }))
        : this.empty(
            this.zh ? "暂无测试报告" : "No test reports yet.",
            "empty:reports",
          );
    }
    if (node.kind === "day") {
      return this.history()
        .filter((entry) => dayKey(entry.sentAt) === node.day)
        .map((data) => ({ kind: "history", data }));
    }
    return [];
  }
  getParent(node: SidebarTreeNode): SidebarTreeNode | undefined {
    if (node.kind === "request" || node.kind === "testFolder") {
      const parent = this.list().find(
        (row) => String(row.id) === String(node.data.parentId),
      );
      return parent ? { kind: node.kind, data: parent } : undefined;
    }
    if (node.kind === "history") {
      return { kind: "day", day: dayKey(node.data.sentAt) };
    }
    if (node.kind === "day") {
      return undefined;
    }
    if (node.kind === "report") {
      return { kind: "reports" };
    }
    return undefined;
  }
}
