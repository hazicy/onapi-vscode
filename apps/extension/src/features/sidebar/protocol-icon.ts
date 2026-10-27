import * as vscode from "vscode";

const protocolIcons = new Set([
  "api",
  "sse",
  "graphql",
  "websocket",
  "socketio",
  "grpc",
  "socket",
  "socket_method",
  "folder",
  "doc",
]);

/** Shared custom SVG icons for native request trees and editor tabs. */
export function getProtocolIcon(
  context: vscode.ExtensionContext,
  data: { kind?: string },
): { light: vscode.Uri; dark: vscode.Uri } | undefined {
  const type = data.kind || "";
  if (!protocolIcons.has(type)) {
    return undefined;
  }
  const name = type === "api" ? "http" : type;
  return iconPaths(context, name);
}

/** Custom non-protocol icons used by native sidebar sections. */
export function getSidebarIcon(
  context: vscode.ExtensionContext,
  name: "tests" | "reports" | "history",
): { light: vscode.Uri; dark: vscode.Uri } {
  return iconPaths(context, name);
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
