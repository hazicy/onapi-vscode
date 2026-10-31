import * as vscode from "vscode";
import { getApiListName } from "../requests/request-storage";
import { handleMessage } from "./sidebar-handler";
import { SidebarTreeProvider } from "./tree-provider";
import type { SidebarTreeNode } from "./tree-data";

const mime = "application/vnd.code.tree.onapirequests";

export class RequestTreeDragController implements vscode.TreeDragAndDropController<SidebarTreeNode> {
  readonly dragMimeTypes = [mime];
  readonly dropMimeTypes = [mime];

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly provider: SidebarTreeProvider,
  ) {}

  handleDrag(
    source: readonly SidebarTreeNode[],
    transfer: vscode.DataTransfer,
  ): void {
    const ids = source
      .filter((node) => node.kind === "request")
      .map((node) => node.data.id);
    if (ids.length) {
      transfer.set(
        mime,
        new vscode.DataTransferItem({
          workspace: getApiListName(this.context),
          ids,
        }),
      );
    }
  }

  async handleDrop(
    target: SidebarTreeNode | undefined,
    transfer: vscode.DataTransfer,
    token: vscode.CancellationToken,
  ): Promise<void> {
    const payload = transfer.get(mime)?.value;
    if (
      token.isCancellationRequested ||
      payload?.workspace !== getApiListName(this.context) ||
      !Array.isArray(payload.ids) ||
      (target && target.kind !== "request" && target.kind !== "empty")
    ) {
      return;
    }
    const rows = this.provider.list();
    const byId = new Map(rows.map((row) => [row.id, row]));
    const selected = new Set<string>(
      payload.ids.filter(
        (id: unknown) => typeof id === "string" && byId.has(id),
      ),
    );
    // Keep selected descendants with their selected ancestor.
    const ids = [...selected].filter((id) => {
      const visited = new Set([id]);
      let parent = byId.get(id)?.parentId;
      while (parent && byId.has(parent)) {
        if (selected.has(parent) || visited.has(parent)) return false;
        visited.add(parent);
        parent = byId.get(parent)?.parentId;
      }
      return true;
    });
    const destination =
      target?.kind === "request" ? byId.get(target.data.id) : undefined;
    if (!ids.length || (target?.kind === "request" && !destination)) return;
    const parentId =
      destination?.kind === "folder"
        ? destination.id
        : destination?.parentId || "0";
    const visited = new Set<string>();
    let ancestor: string | undefined = parentId;
    while (ancestor && byId.has(ancestor)) {
      if (selected.has(ancestor) || visited.has(ancestor)) return;
      visited.add(ancestor);
      ancestor = byId.get(ancestor)?.parentId;
    }
    if (destination && selected.has(destination.id)) return;
    await handleMessage(
      {
        action: "onDrop",
        data: {
          ids:
            destination && destination.kind !== "folder" ? ids.reverse() : ids,
          parentId,
          after_id: "0",
          before_id:
            destination && destination.kind !== "folder" ? destination.id : "0",
        },
      },
      this.context,
    );
    this.provider.refresh();
  }
}
