import { registerFormatter } from "./formatter";
import * as vscode from "vscode";
import path from "node:path";
import { getHtmlForWebview } from "./html";
import { LOCAL_PORT } from "../../app/config";

type PanelDefinition = { viewType: string; title: string; iconName: string };
type PanelOptions = { title?: string; data?: unknown; hydrate?: boolean };

/** Common Webview setup. Feature modules own reuse, messages and disposal. */
export function createFeaturePanel(
  context: vscode.ExtensionContext,
  definition: PanelDefinition,
  options: PanelOptions = {},
) {
  const { viewType, iconName } = definition;
  const panel = vscode.window.createWebviewPanel(
    viewType,
    options.title ?? definition.title,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      enableFindWidget: true,
      enableCommandUris: true,
    },
  );
  if (iconName) {
    panel.iconPath = vscode.Uri.file(
      path.join(context.extensionPath, "dist", "images", iconName),
    );
  }
  const resourceBase = panel.webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, "dist", "webviews")),
  );
  const script =
    process.env.ONAPI_DEV_SERVER === "true"
      ? `http://localhost:${LOCAL_PORT}/src/app/webviews/${viewType[0].toUpperCase()}${viewType.slice(1)}.tsx`
      : panel.webview.asWebviewUri(
          vscode.Uri.file(
            path.join(
              context.extensionPath,
              "dist",
              "webviews",
              `${viewType}.js`,
            ),
          ),
        );
  registerFormatter(panel, context);
  panel.webview.html = getHtmlForWebview(
    script,
    resourceBase,
    options.data ?? null,
  );
  return panel;
}
