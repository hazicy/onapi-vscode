import * as vscode from "vscode";
import { requestMethod } from "@onapi/domain";

type IconData = { kind?: string; method?: string; request?: unknown };
const httpMethods = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
]);
function iconName(data: IconData): string {
  if (data.kind !== "api") {
    return data.kind!;
  }
  const method = requestMethod(data).trim().toUpperCase();
  return httpMethods.has(method) ? `http-${method.toLowerCase()}` : "http";
}

const protocolIcons = new Set([
  "api",
  "ai",
  "mcp",
  "graphql",
  "websocket",
  "socketio",
  "grpc",
  "folder",
  "doc",
]);

/** Native tree icons inherit the active VS Code icon foreground. */
export function getProtocolTreeIcon(
  data: IconData,
): vscode.ThemeIcon | undefined {
  if (!protocolIcons.has(data.kind || "")) {
    return undefined;
  }
  const name = iconName(data);
  return new vscode.ThemeIcon(`onapi-${name.replaceAll("_", "-")}`);
}

/** SVG paths for editor surfaces whose icon API does not accept ThemeIcon. */
export function getProtocolIcon(
  context: vscode.ExtensionContext,
  data: IconData,
): { light: vscode.Uri; dark: vscode.Uri } | undefined {
  const type = data.kind || "";
  if (!protocolIcons.has(type)) {
    return undefined;
  }
  const name = iconName(data);
  return iconPaths(context, name);
}

/** Custom non-protocol icons used by native sidebar sections. */
export function getSidebarIcon(
  context: vscode.ExtensionContext,
  name: "tests" | "reports" | "history",
): vscode.ThemeIcon {
  return new vscode.ThemeIcon(`onapi-${name}`);
}

function iconPaths(
  context: vscode.ExtensionContext,
  name: string,
): { light: vscode.Uri; dark: vscode.Uri } {
  return {
    light: vscode.Uri.joinPath(
      context.extensionUri,
      "dist",
      "images",
      `${name}.svg`,
    ),
    dark: vscode.Uri.joinPath(
      context.extensionUri,
      "dist",
      "images",
      `${name}-dark.svg`,
    ),
  };
}
