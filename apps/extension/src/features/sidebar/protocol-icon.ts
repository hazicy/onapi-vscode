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

/** Font-backed icons support theme colors; editor tabs still use SVG paths. */
export function getProtocolTreeIcon(
  data: { kind?: string },
  color?: string,
): vscode.ThemeIcon | undefined {
  if (!protocolIcons.has(data.kind || "")) {
    return undefined;
  }
  const name = data.kind === "api" ? "http" : data.kind!;
  return new vscode.ThemeIcon(
    `onapi-${name.replaceAll("_", "-")}`,
    color ? new vscode.ThemeColor(color) : undefined,
  );
}

/** SVG paths for editor surfaces whose icon API does not accept ThemeIcon. */
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
