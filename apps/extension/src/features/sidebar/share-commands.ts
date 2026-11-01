import * as vscode from "vscode";
import type { SidebarTreeNode } from "./tree-data";
import type { SidebarCommandContext } from "./command-context";
import { globalConfig } from "../../app/config";
import { getDocumentItems } from "../sharing/document-items";
import {
  createShare,
  getDocBaseUrl,
  getProjectShareData,
} from "../sharing/share-data";

export function registerShareCommands({
  context,
  command,
  list,
  selectedData,
  zh,
}: SidebarCommandContext) {
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
}
