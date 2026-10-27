import type { Key, ReactNode, ReactElement } from "react";
import type { DataNode, TreeProps } from "./types";

export type TreeNode = Omit<DataNode, "children" | "id"> & {
  id: string;
  pos: string;
  parentId: string;
  folder: boolean;
  children: TreeNode[];
};
export function indexTree(
  data: any[],
  fields: TreeProps["fieldNames"] = {},
  rootId = "__root__",
) {
  const nodes = new Map<string, TreeNode>();
  const visit = (
    items: any[],
    parentId: string,
    position: string,
  ): TreeNode[] =>
    items.map((item, index) => {
      const key = item[fields.key ?? "key"];
      const node: TreeNode = {
        ...item,
        key,
        id: String(key),
        title: item[fields.title ?? "title"],
        pos: `${position}-${index}`,
        parentId,
        folder:
          item.isLeaf !== true &&
          (item.isLeaf === false ||
            Array.isArray(item[fields.children ?? "children"])),
        children: [],
      };
      nodes.set(node.id, node);
      node.children = visit(
        item[fields.children ?? "children"] ?? [],
        node.id,
        node.pos,
      );
      return node;
    });
  const children = visit(data, rootId, "0");
  nodes.set(rootId, {
    key: rootId,
    id: rootId,
    parentId: "",
    folder: true,
    pos: "0",
    title: "",
    children,
  });
  return { nodes, children };
}

// Preserve disabled-node boundaries when conducting checks in import previews.
export function treeChecks(
  nodes: Map<string, TreeNode>,
  keys: Key[],
  strict = false,
) {
  const checked = new Set(keys.map(String));
  const half = new Set<string>();
  if (!strict) {
    const descend = (node: TreeNode) => {
      for (const child of node.children) {
        if (
          child.disabled ||
          child.disableCheckbox ||
          child.checkable === false
        ) {
          continue;
        }
        checked.add(child.id);
        descend(child);
      }
    };
    for (const id of [...checked]) {
      const node = nodes.get(id);
      if (node && !node.disabled) {
        descend(node);
      }
    }
    for (const node of [...nodes.values()].reverse()) {
      if (
        !node.parentId ||
        node.disabled ||
        node.disableCheckbox ||
        node.checkable === false
      ) {
        continue;
      }
      const children = node.children.filter(
        (child) =>
          !child.disabled &&
          !child.disableCheckbox &&
          child.checkable !== false,
      );
      if (!children.length) {
        continue;
      }
      if (children.every((child) => checked.has(child.id))) {
        checked.add(node.id);
      } else {
        checked.delete(node.id);
        if (
          children.some((child) => checked.has(child.id) || half.has(child.id))
        ) {
          half.add(node.id);
        }
      }
    }
  }
  return {
    checked: [...checked]
      .filter((id) => nodes.get(id)?.parentId)
      .map((id) => nodes.get(id)?.key ?? id),
    half: [...half]
      .filter((id) => nodes.get(id)?.parentId)
      .map((id) => nodes.get(id)!.key),
  };
}
export function toggleTreeCheck(
  nodes: Map<string, TreeNode>,
  keys: Key[],
  id: string,
  strict = false,
) {
  const previous = treeChecks(nodes, keys, strict);
  const checked = new Set(previous.checked.map(String));
  const remove = checked.has(id);
  const visit = (node: TreeNode) => {
    if (node.disabled || node.disableCheckbox || node.checkable === false) {
      return;
    }
    if (remove) {
      checked.delete(node.id);
    } else {
      checked.add(node.id);
    }
    if (!strict) {
      node.children.forEach(visit);
    }
  };
  const node = nodes.get(id);
  if (!node) {
    return previous;
  }
  visit(node);
  if (!strict) {
    let parent = nodes.get(node.parentId);
    while (parent) {
      checked.delete(parent.id);
      parent = nodes.get(parent.parentId);
    }
  }
  return treeChecks(nodes, [...checked], strict);
}
export function nodeText(value: ReactNode): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(nodeText).join("");
  }
  if (value && typeof value === "object" && "props" in value) {
    const props = (
      value as ReactElement<{
        name?: ReactNode;
        title?: ReactNode;
        children?: ReactNode;
      }>
    ).props;
    return nodeText(props.name ?? props.title ?? props.children);
  }
  return "";
}
