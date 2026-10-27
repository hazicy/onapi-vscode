import * as vscode from "vscode";
import type { ApiDetailsData } from "@onapi/domain/requests/types/api";
import type { SidebarTreeNode } from "./tree-data";
import { countFolderRequests } from "./tree-data";
import { getApiListName } from "../requests/request-storage";
import { getProtocolIcon, getSidebarIcon } from "./protocol-icon";
import { isHttpCollectionItem, requestUrl, requestMethod } from "@onapi/domain";

function configureRequestItem(
  item: vscode.TreeItem,
  context: vscode.ExtensionContext,
  list: () => ApiDetailsData[],
  data: Pick<ApiDetailsData, "name" | "url" | "method" | "id"> & {
    kind: string;
  },
  prefix: string,
) {
  const folder = data.kind === "folder";
  item.label = data.name || "";
  item.collapsibleState = folder
    ? vscode.TreeItemCollapsibleState.Collapsed
    : vscode.TreeItemCollapsibleState.None;
  item.id = `${prefix}:${data.id}`;
  item.contextValue = folder
    ? "onapiFolder"
    : ["api", "graphql"].includes(data.kind)
      ? "onapiRequestHttp"
      : "onapiRequest";
  const protocolLabels: Record<string, string> = {
    sse: "SSE",
    graphql: "GraphQL",
    websocket: "WebSocket",
    socketio: "Socket.IO",
    grpc: "gRPC",
  };
  const requestLabel =
    protocolLabels[data.kind] ||
    String(
      (isHttpCollectionItem(data) ? requestMethod(data) : data.method) ||
        data.kind,
    ).toUpperCase();
  const count = folder ? countFolderRequests(list(), data.id) : 0;
  item.description = folder ? (count ? `(${count})` : undefined) : requestLabel;
  item.iconPath = getProtocolIcon(context, data);
  item.tooltip = [
    data.name,
    folder ? undefined : requestLabel,
    isHttpCollectionItem(data) ? requestUrl(data) : data.url,
  ]
    .filter(Boolean)
    .join(" ");
}

export class RequestTreeItem extends vscode.TreeItem {
  constructor(
    node: Extract<SidebarTreeNode, { kind: "request" }>,
    context: vscode.ExtensionContext,
    list: () => ApiDetailsData[],
  ) {
    super("");
    configureRequestItem(this, context, list, node.data, "request");
    if (node.data.kind !== "folder") {
      this.resourceUri = vscode.Uri.from({
        scheme: "onapi-request",
        authority: "status",
        path: `/${encodeURIComponent(getApiListName(context))}/${encodeURIComponent(node.data.id)}`,
      });
    }
    if (node.data.kind !== "folder") {
      this.command = {
        command: "onapi.tree.open",
        title: "Open Request",
        arguments: [node],
      };
    }
  }
}

export class TestFolderTreeItem extends vscode.TreeItem {
  constructor(
    node: Extract<SidebarTreeNode, { kind: "testFolder" }>,
    context: vscode.ExtensionContext,
    list: () => ApiDetailsData[],
    zh: boolean,
    hasChildren: boolean,
  ) {
    super("");
    configureRequestItem(this, context, list, node.data, "test");
    this.collapsibleState = hasChildren
      ? vscode.TreeItemCollapsibleState.Collapsed
      : vscode.TreeItemCollapsibleState.None;
    this.contextValue = "onapiTestFolder";
    this.iconPath = getSidebarIcon(context, "tests");
    this.command = {
      command: "onapi.tree.runTests",
      title: "Open Tests",
      arguments: [node],
    };
    this.tooltip = zh
      ? `${node.data.name}：打开测试配置与运行页面`
      : `${node.data.name}: open test configuration and runner`;
  }
}

export class ReportsTreeItem extends vscode.TreeItem {
  constructor(
    context: vscode.ExtensionContext,
    zh: boolean,
    reportCount: number,
  ) {
    super(
      zh ? "测试报告" : "Test Reports",
      vscode.TreeItemCollapsibleState.Collapsed,
    );
    this.id = "test-reports";
    this.iconPath = getSidebarIcon(context, "reports");
    this.description = String(reportCount);
  }
}

export class ReportTreeItem extends vscode.TreeItem {
  constructor(node: Extract<SidebarTreeNode, { kind: "report" }>, zh: boolean) {
    super(node.data.report_name || (zh ? "测试报告" : "Test Report"));
    this.id = `report:${node.data.report_id}`;
    this.contextValue = "onapiReport";
    const report = node.data as any;
    const failed = report.events?.some(
      (event: any) =>
        event.error ||
        event.assertions?.some((assertion: any) => !assertion.passed),
    );
    this.iconPath = new vscode.ThemeIcon(
      failed ? "error" : "pass",
      new vscode.ThemeColor(
        !failed ? "testing.iconPassed" : "testing.iconFailed",
      ),
    );
    this.description = report.startedAt
      ? new Date(report.startedAt).toLocaleString()
      : undefined;
    this.command = {
      command: "onapi.tree.openReport",
      title: "Open Report",
      arguments: [node],
    };
  }
}

export class HistoryDayTreeItem extends vscode.TreeItem {
  constructor(
    node: Extract<SidebarTreeNode, { kind: "day" }>,
    context: vscode.ExtensionContext,
    historyCount: number,
  ) {
    super(node.day, vscode.TreeItemCollapsibleState.Expanded);
    this.id = `history-day:${node.day}`;
    this.iconPath = getSidebarIcon(context, "history");
    this.description = String(historyCount);
  }
}

export class HistoryTreeItem extends vscode.TreeItem {
  constructor(
    node: Extract<SidebarTreeNode, { kind: "history" }>,
    context: vscode.ExtensionContext,
    list: () => ApiDetailsData[],
  ) {
    super("");
    configureRequestItem(this, context, list, node.data.request, "history");
    this.id = `history:${node.data.id}`;
    this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    this.contextValue = "onapiHistory";
    this.description = new Date(node.data.sentAt).toLocaleTimeString();
    this.tooltip = `${this.tooltip}\n${new Date(node.data.sentAt).toLocaleString()}`;
    this.command = {
      command: "onapi.tree.openHistory",
      title: "Open Historical Request",
      arguments: [node],
    };
  }
}

export class EmptyTreeItem extends vscode.TreeItem {
  constructor(node: Extract<SidebarTreeNode, { kind: "empty" }>) {
    super(node.label);
    this.id = node.id;
    if (node.id === "storage:error") {
      this.command = {
        command: "onapi.storage.recover",
        title: "Recover storage",
      };
    }
    this.iconPath = new vscode.ThemeIcon("info");
  }
}
