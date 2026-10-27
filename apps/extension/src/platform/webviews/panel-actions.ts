import type { RequestPanelResponseInput } from "@onapi/contracts/request-panel";
import { postRequestPanelResponse } from "./request-panel-channel";
import * as vscode from "vscode";
import { getCurrentProjectConfig } from "../storage/project-config";
import { getApiList } from "../../features/requests/request-storage";
import { getDocBaseUrl, getOpenApi } from "../../features/sharing/share-data";
import { downloadFile } from "../host-utils";

type Message = { action: string; data?: unknown; requestId?: string };

/** Operations shared by panels; feature-specific writes remain with their owner. */
export async function handlePanelAction(
  message: Message,
  context: vscode.ExtensionContext,
  panel?: vscode.WebviewPanel | null,
) {
  const post = (response: RequestPanelResponseInput) =>
    panel &&
    postRequestPanelResponse(panel.webview, {
      ...response,
      ...(message.requestId ? { requestId: message.requestId } : {}),
    });
  switch (message.action) {
    case "getProjectConfig":
      post({
        action: "setProjectConfig",
        data: getCurrentProjectConfig(context),
      });
      return true;
    case "getApiList":
      post({ action: "setApiList", data: getApiList(context) });
      return true;
    case "getSystemConfig":
      post({
        action: "setSystemConfig",
        data:
          context.globalState.get<Record<string, unknown>>("systemConfig") ||
          {},
      });
      return true;
    case "getVscodeTheme":
      post({
        action: "setVscodeTheme",
        data: vscode.workspace
          .getConfiguration("workbench")
          .get<string>("colorTheme"),
      });
      return true;
    case "getDocBaseUrl":
      post({ action: "setDocBaseUrl", data: getDocBaseUrl(context) });
      return true;
    case "openNewWindow":
      if (typeof message.data === "string") {
        await vscode.env.openExternal(vscode.Uri.parse(message.data));
      }
      return true;
    case "exportOpenApiById": {
      const id =
        message.data && typeof message.data === "object" && "id" in message.data
          ? message.data.id
          : undefined;
      const request = getApiList(context).find((item) => item.id === id);
      if (request) {
        const file = await getOpenApi(request, context);
        if (file) {
          await downloadFile(file.fileName, file.openApiStr);
        }
      }
      return true;
    }
    default:
      return false;
  }
}
