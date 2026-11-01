import * as vscode from "vscode";
import type { ApiDetailsData } from "@onapi/domain/requests/types/api";
import type { SidebarTreeNode } from "./tree-data";

export type SidebarCommandContext = {
  context: vscode.ExtensionContext;
  command: <Args extends unknown[]>(
    id: string,
    callback: (...args: Args) => unknown,
  ) => void;
  list: () => ApiDetailsData[];
  selectedData: (node?: SidebarTreeNode) => ApiDetailsData | undefined;
  refresh: () => void;
  zh: boolean;
};

export function createSidebarCommandContext(
  context: vscode.ExtensionContext,
  list: SidebarCommandContext["list"],
  refresh: () => void,
): SidebarCommandContext {
  return {
    context,
    list,
    refresh,
    zh: vscode.env.language.startsWith("zh"),
    command: (id, callback) => {
      context.subscriptions.push(vscode.commands.registerCommand(id, callback));
    },
    selectedData: (node) => {
      if (!node || (node.kind !== "request" && node.kind !== "testFolder")) {
        return;
      }
      return list().find((item) => item.id === node.data.id);
    },
  };
}
