import * as vscode from "vscode";
import { STATUS_CODE } from "@onapi/domain/constants/common";
import { globalConfig } from "../../app/config";
import { postRequestPanelResponse } from "../../platform/webviews/request-panel-channel";

export function registerRequestLayoutCommand(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("onapi.request.changeLayout", async () => {
      const zh = vscode.env.language.startsWith("zh");
      const config = context.globalState.get<Record<string, unknown>>(
        "systemConfig",
        {},
      );
      const options = [
        {
          label: zh ? "上下布局" : "Stacked",
          description: zh ? "请求在上，响应在下" : "Request above response",
          direction: STATUS_CODE.ENABLE,
        },
        {
          label: zh ? "左右布局" : "Side by Side",
          description: zh ? "请求在左，响应在右" : "Request beside response",
          direction: STATUS_CODE.DISABLE,
        },
      ];
      const selected = await vscode.window.showQuickPick(
        options.map((option) => ({
          ...option,
          detail:
            option.direction === (config.tab_direction ?? STATUS_CODE.ENABLE)
              ? zh
                ? "当前布局"
                : "Current layout"
              : undefined,
        })),
        {
          title: zh ? "请求面板布局" : "Request Panel Layout",
          placeHolder: zh
            ? "选择请求与响应的排列方式"
            : "Choose how to arrange request and response panels",
        },
      );
      if (!selected) {
        return;
      }
      const latest = context.globalState.get<Record<string, unknown>>(
        "systemConfig",
        {},
      );
      const next = { ...latest, tab_direction: selected.direction };
      await context.globalState.update("systemConfig", next);
      for (const panel of Object.values(globalConfig.openedPanels)) {
        postRequestPanelResponse(panel.webview, {
          action: "setSystemConfig",
          data: next,
        });
      }
    }),
  );
}
