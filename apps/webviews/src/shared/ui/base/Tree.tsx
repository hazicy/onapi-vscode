import treeStyles from "./Tree.module.css";
import React, {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTree, AssistiveTreeDescription } from "@headless-tree/react";
import {
  syncDataLoaderFeature,
  selectionFeature,
  hotkeysCoreFeature,
  dragAndDropFeature,
  keyboardDragAndDropFeature,
  type DragTarget,
  type ItemInstance,
} from "@headless-tree/core";
import clsx from "clsx";
import { Checkbox } from "./Checkbox";
import type { DataNode, TreeProps, TreeHandle, TreeEventNode } from "./types";
import {
  indexTree,
  treeChecks,
  toggleTreeCheck,
  nodeText,
  type TreeNode,
} from "./treeData";

const EMPTY: never[] = [];
const features = [
  syncDataLoaderFeature,
  selectionFeature,
  hotkeysCoreFeature,
  dragAndDropFeature,
  keyboardDragAndDropFeature,
];
const TreeControl = forwardRef<TreeHandle, TreeProps>(function TreeControl(
  {
    treeData = EMPTY,
    fieldNames,
    selectedKeys,
    defaultSelectedKeys = EMPTY,
    expandedKeys,
    defaultExpandedKeys = EMPTY,
    defaultExpandAll,
    checkedKeys,
    defaultCheckedKeys = EMPTY,
    checkable,
    checkStrictly,
    selectable = true,
    multiple,
    disabled,
    loadData,
    onSelect,
    onExpand,
    onCheck,
    draggable,
    allowDrop,
    onDrop,
    onDragOver,
    titleRender,
    switcherIcon,
    icon,
    showIcon = true,
    className,
    rootClassName,
    height,
    style,
    onScroll,
    expandAction,
    onRightClick,
    autoExpandParent,
    ...props
  },
  ref,
) {
  const rootId = useId();
  const { nodes } = useMemo(
    () => indexTree(treeData, fieldNames, rootId),
    [
      treeData,
      fieldNames?.key,
      fieldNames?.title,
      fieldNames?.children,
      rootId,
    ],
  );
  const [internalExpanded, setExpanded] = useState<React.Key[]>(() =>
    defaultExpandAll
      ? [...nodes.values()]
          .filter((node) => node.children.length)
          .map((node) => node.key)
      : defaultExpandedKeys,
  );
  const [internalSelected, setSelected] =
    useState<React.Key[]>(defaultSelectedKeys);
  const [internalChecked, setChecked] =
    useState<React.Key[]>(defaultCheckedKeys);
  const [loading, setLoading] = useState(new Set<string>());
  const loaded = useRef(new Set<string>());
  const event = useRef<React.SyntheticEvent>({
    type: "programmatic",
  } as React.SyntheticEvent);
  const container = useRef<HTMLDivElement>(null);
  const selectionAnchor = useRef<string | null>(null);
  const expandedKey = JSON.stringify(expandedKeys ?? internalExpanded);
  const expanded = useMemo(() => {
    const ids: string[] = JSON.parse(expandedKey).map(String);
    if (autoExpandParent) {
      for (const id of [...ids]) {
        let parent = nodes.get(nodes.get(id)?.parentId ?? "");
        while (parent && parent.id !== rootId) {
          if (!ids.includes(parent.id)) {
            ids.push(parent.id);
          }
          parent = nodes.get(parent.parentId);
        }
      }
    }
    return ids;
  }, [expandedKey, autoExpandParent, nodes, rootId]);
  const selectedKey = JSON.stringify(selectedKeys ?? internalSelected);
  const selected = useMemo<string[]>(
    () => JSON.parse(selectedKey).map(String),
    [selectedKey],
  );
  const checks = treeChecks(
    nodes,
    Array.isArray(checkedKeys)
      ? checkedKeys
      : (checkedKeys?.checked ?? internalChecked),
    checkStrictly,
  );
  const checked = new Set(checks.checked.map(String));
  const half = new Set(
    (!Array.isArray(checkedKeys) && checkedKeys?.halfChecked
      ? checkedKeys.halfChecked
      : checks.half
    ).map(String),
  );
  const eventNode = (node: TreeNode): TreeEventNode => ({
    ...node,
    expanded: expanded.includes(node.id),
    selected: selected.includes(node.id),
    checked: checked.has(node.id),
  });
  const checkNode = (
    node: TreeNode,
    e: Pick<React.SyntheticEvent, "nativeEvent">,
  ) => {
    if (
      disabled ||
      node.disabled ||
      node.disableCheckbox ||
      node.checkable === false
    ) {
      return;
    }
    const next = toggleTreeCheck(nodes, checks.checked, node.id, checkStrictly);
    setChecked(next.checked);
    onCheck?.(
      checkStrictly
        ? { checked: next.checked, halfChecked: next.half }
        : next.checked,
      {
        node: eventNode(node),
        checked: !checked.has(node.id),
        checkedNodes: next.checked.map((key) => nodes.get(String(key))!),
        halfCheckedKeys: next.half,
        nativeEvent: e.nativeEvent,
      },
    );
  };
  const keys = (ids: string[]) =>
    ids
      .filter((id) => id !== rootId && nodes.has(id))
      .map((id) => nodes.get(id)!.key);
  const dropInfo = (target: DragTarget<TreeNode>) => {
    if (!("childIndex" in target)) {
      return { node: target.item.getItemData(), position: 0 };
    }
    const siblings = target.item.getChildren();
    const next = siblings[target.childIndex];
    const previous = siblings[target.childIndex - 1];
    return next
      ? { node: next.getItemData(), position: -1 }
      : previous
        ? { node: previous.getItemData(), position: 1 }
        : { node: target.item.getItemData(), position: 0 };
  };
  const tree = useTree<TreeNode>({
    rootItemId: rootId,
    features,
    dataLoader: {
      getItem: (id) => nodes.get(id)!,
      getChildren: (id) =>
        (nodes.get(id)?.children ?? []).map((node) => node.id),
    },
    isItemFolder: (item) =>
      item.getId() === rootId ||
      item.getItemData().folder ||
      (!!loadData && item.getItemData().isLeaf !== true),
    getItemName: (item) =>
      nodeText(item.getItemData().title) ||
      String(item.getItemData().name ?? item.getId()),
    state: { expandedItems: expanded, selectedItems: selected },
    setExpandedItems: (updater) => {
      const next = typeof updater === "function" ? updater(expanded) : updater;
      const changed = [...new Set([...expanded, ...next])].find(
        (id) => expanded.includes(id) !== next.includes(id),
      );
      const node = changed ? nodes.get(changed) : undefined;
      if (disabled || node?.disabled) {
        return;
      }
      setExpanded(keys(next));
      if (node) {
        onExpand?.(keys(next), {
          node: eventNode(node),
          expanded: next.includes(node.id),
          nativeEvent: event.current,
        });
        if (
          next.includes(node.id) &&
          loadData &&
          !loaded.current.has(node.id) &&
          !loading.has(node.id)
        ) {
          setLoading((current) => new Set(current).add(node.id));
          Promise.resolve(loadData(eventNode(node)))
            .then(() => {
              loaded.current.add(node.id);
            })
            .catch(() => {})
            .finally(() =>
              setLoading((current) => {
                const next = new Set(current);
                next.delete(node.id);
                return next;
              }),
            );
        }
      }
    },
    setSelectedItems: (updater) => {
      if (disabled || !selectable) {
        return;
      }
      let next = typeof updater === "function" ? updater(selected) : updater;
      next = next.filter(
        (id: string) =>
          !nodes.get(id)?.disabled && nodes.get(id)?.selectable !== false,
      );
      if (!multiple) {
        next = next.slice(-1);
      }
      setSelected(keys(next));
      const changed =
        next.find((id) => !selected.includes(id)) ??
        selected.find((id) => !next.includes(id)) ??
        next.at(-1);
      const node = changed ? nodes.get(changed) : undefined;
      if (node) {
        onSelect?.(keys(next), {
          node: eventNode(node),
          selected: next.includes(node.id),
          selectedNodes: next.map((id: string) => nodes.get(id)!),
          nativeEvent: event.current,
        });
      }
    },
    indent: 18,
    canReorder: true,
    openOnDropDelay: 0,
    canDrag: (items) =>
      !!draggable &&
      !disabled &&
      items.every((item) => {
        const node = item.getItemData();
        return (
          !node.disabled &&
          (typeof draggable === "function"
            ? draggable(node)
            : typeof draggable === "object"
              ? draggable.nodeDraggable?.(node) !== false
              : true)
        );
      }),
    canDrop: (items, target) => {
      const { node, position } = dropInfo(target);
      if (!node || node.id === rootId || node.disabled) {
        return false;
      }
      return items.every(
        (item) =>
          item.getId() !== node.id &&
          !target.item.isDescendentOf(item.getId()) &&
          allowDrop?.({
            dropNode: eventNode(node),
            dragNode: eventNode(item.getItemData()),
            dropPosition: position,
          }) !== false,
      );
    },
    onDrop: (items, target) => {
      const { node, position } = dropInfo(target);
      if (!node || node.id === rootId) {
        return;
      }
      for (const item of items) {
        onDrop?.({
          node: eventNode(node),
          dragNode: eventNode(item.getItemData()),
          dropPosition: Number(node.pos.split("-").at(-1)) + position,
          dropToGap: position !== 0,
          event: event.current as React.DragEvent,
        });
      }
    },
  });
  useEffect(() => {
    tree.rebuildTree();
  }, [nodes, expanded.join("\u0000")]);
  useImperativeHandle(
    ref,
    () => ({
      scrollTo: ({ key }) => {
        void tree.getItemInstance(String(key)).scrollTo({ block: "nearest" });
      },
    }),
    [tree],
  );
  const toggle = (
    item: ItemInstance<TreeNode>,
    nativeEvent: React.SyntheticEvent,
  ) => {
    if (disabled || item.getItemData().disabled) {
      return;
    }
    nativeEvent.stopPropagation();
    event.current = nativeEvent;
    if (item.isExpanded()) {
      item.collapse();
    } else {
      item.expand();
    }
  };
  return (
    <div
      {...tree.getContainerProps(props["aria-label"])}
      ref={(element) => {
        container.current = element;
        tree.registerElement(element);
      }}
      className={clsx(treeStyles.tree, className, rootClassName)}
      style={{ position: "relative", overflow: "auto", height, ...style }}
      onScroll={onScroll}
      onKeyDownCapture={(e) => {
        event.current = e;
        if (
          (e.key === "Enter" || e.key === " ") &&
          !e.ctrlKey &&
          !e.metaKey &&
          !tree.getState().dnd?.draggedItems?.length &&
          (e.target as HTMLElement).getAttribute("role") === "treeitem"
        ) {
          const item = tree.getFocusedItem();
          const node = item?.getItemData();
          if (!node || disabled || node.disabled) {
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          if (e.key === " " && checkable) {
            checkNode(node, e);
          } else if (selectable && node.selectable !== false) {
            tree.setSelectedItems([node.id]);
          }
        }
      }}
      onClickCapture={(e) => {
        event.current = e;
      }}
      onDragEnterCapture={(e) => {
        event.current = e;
      }}
      onDragOverCapture={(e) => {
        event.current = e;
      }}
      onDropCapture={(e) => {
        event.current = e;
      }}
    >
      <div data-part="list">
        {tree.getItems().map((item) => {
          const node = item.getItemData();
          if (!node) {
            return null;
          }
          const itemProps = item.getProps();
          const info = eventNode(node);
          const inactive = disabled || node.disabled;
          const switcher =
            typeof switcherIcon === "function"
              ? switcherIcon(info)
              : switcherIcon;
          const nodeIcon =
            typeof (node.icon ?? icon) === "function"
              ? (node.icon ?? icon)(info)
              : (node.icon ?? icon);
          return (
            <div
              {...itemProps}
              key={item.getId()}
              ref={item.registerElement}
              aria-disabled={!!inactive}
              aria-selected={selected.includes(node.id)}
              aria-checked={
                checkable
                  ? half.has(node.id)
                    ? "mixed"
                    : checked.has(node.id)
                  : undefined
              }
              className={clsx(
                inactive && treeStyles.disabled,
                item.isDragTarget() && treeStyles.dropTarget,
              )}
              style={{
                ...node.style,
                paddingInlineStart: Math.max(0, item.getItemMeta().level) * 18,
              }}
              onClick={(e) => {
                if (inactive) {
                  return;
                }
                item.setFocused();
                if (selectable && node.selectable !== false) {
                  if (multiple && e.shiftKey && selectionAnchor.current) {
                    const items = tree.getItems();
                    const start = items.findIndex(
                      (entry) => entry.getId() === selectionAnchor.current,
                    );
                    const end = items.findIndex(
                      (entry) => entry.getId() === node.id,
                    );
                    const range = items
                      .slice(Math.min(start, end), Math.max(start, end) + 1)
                      .map((entry) => entry.getId());
                    tree.setSelectedItems(
                      e.ctrlKey || e.metaKey
                        ? [...new Set([...selected, ...range])]
                        : range,
                    );
                  } else if (multiple && (e.ctrlKey || e.metaKey)) {
                    item.toggleSelect();
                  } else {
                    tree.setSelectedItems([node.id]);
                  }
                  if (!e.shiftKey) {
                    selectionAnchor.current = node.id;
                  }
                }
                if (expandAction === "click" && item.isFolder()) {
                  toggle(item, e);
                }
              }}
              onDoubleClick={(e) => {
                if (expandAction === "doubleClick" && item.isFolder()) {
                  toggle(item, e);
                }
              }}
              onContextMenu={(e) => onRightClick?.({ event: e, node: info })}
              onDragOver={(e) => {
                event.current = e;
                itemProps.onDragOver?.(e);
                onDragOver?.({ node: info, event: e });
              }}
            >
              <button
                type="button"
                tabIndex={-1}
                data-part="switcher"
                aria-label={`${item.isExpanded() ? "Collapse" : "Expand"} ${item.getItemName()}`}
                disabled={!!inactive || !item.isFolder()}
                onClick={(e) => toggle(item, e)}
                style={{ visibility: item.isFolder() ? undefined : "hidden" }}
              >
                {loading.has(node.id)
                  ? "…"
                  : (switcher ?? (item.isExpanded() ? "⌄" : "›"))}
              </button>
              {checkable && node.checkable !== false && (
                <Checkbox
                  aria-label={`Select ${item.getItemName()}`}
                  tabIndex={-1}
                  disabled={!!inactive || node.disableCheckbox}
                  checked={checked.has(node.id)}
                  indeterminate={half.has(node.id)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    checkNode(node, e);
                  }}
                />
              )}
              <span data-part="content">
                {showIcon && nodeIcon}
                <span data-part="title">
                  {titleRender ? titleRender(node) : node.title}
                </span>
              </span>
            </div>
          );
        })}
      </div>
      {draggable && (
        <>
          <div data-part="drop-indicator" style={tree.getDragLineStyle()} />
          <AssistiveTreeDescription tree={tree} />
        </>
      )}
    </div>
  );
});
const GenericTree = TreeControl as <T = DataNode>(
  props: TreeProps<T> & React.RefAttributes<TreeHandle>,
) => React.ReactElement;
export const Tree = Object.assign(GenericTree, { DirectoryTree: GenericTree });
