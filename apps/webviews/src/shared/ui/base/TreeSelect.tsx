import treeSelectStyles from "./TreeSelect.module.css";
import { useId, useMemo, useState } from "react";
import { forwardRef } from "./forwardRef";
import { Popover } from "@base-ui/react/popover";
import clsx from "clsx";
import { Tree } from "./Tree";
import { Input } from "./Input";
import { nodeText } from "./treeData";
import type { DataNode, TreeSelectProps } from "./types";

const EMPTY: never[] = [];
export const TreeSelect = forwardRef<HTMLButtonElement, TreeSelectProps>(
  function TreeSelect(allProps, ref) {
    const {
      treeData = EMPTY,
      fieldNames,
      value,
      defaultValue,
      onChange,
      onSelect,
      treeTitleRender,
      showSearch,
      searchValue,
      onSearch,
      filterTreeNode,
      treeDefaultExpandAll,
      treeDefaultExpandedKeys,
      treeExpandedKeys,
      onTreeExpand,
      treeExpandAction = "click",
      placeholder,
      disabled,
      className,
      rootClassName,
      popupClassName,
      dropdownClassName,
      dropdownStyle,
      style,
      dropdownRender,
      popupRender,
      open,
      defaultOpen,
      onDropdownVisibleChange,
      onOpenChange,
      allowClear,
      treeNodeFilterProp = "title",
      treeNodeLabelProp,
      notFoundContent = "No data",
      ...props
    } = allProps;
    const [internalValue, setValue] = useState(defaultValue);
    const [internalOpen, setOpen] = useState(!!defaultOpen);
    const [search, setSearch] = useState("");
    const current = "value" in allProps ? value : internalValue;
    const visible = open ?? internalOpen;
    const query = searchValue ?? search;
    const popupId = useId();
    const valueField = fieldNames?.value ?? "value";
    const labelField = fieldNames?.label ?? "title";
    const childrenField = fieldNames?.children ?? "children";
    const { nodes, all } = useMemo(() => {
      const all = new Map<string, any>();
      const visit = (list: any[]): DataNode[] =>
        list.map((node) => {
          const key = node[valueField] ?? node.key;
          all.set(String(key), node);
          return {
            ...node,
            key,
            title: node[labelField],
            isLeaf: node.isLeaf ?? !node[childrenField]?.length,
            children: visit(node[childrenField] ?? []),
          };
        });
      return { nodes: visit(treeData), all };
    }, [treeData, valueField, labelField, childrenField]);
    const filtered = useMemo(() => {
      if (!query || filterTreeNode === false) {
        return nodes;
      }
      const visit = (list: DataNode[]): DataNode[] =>
        list.flatMap((node) => {
          const children = visit(node.children ?? []);
          const match =
            typeof filterTreeNode === "function"
              ? filterTreeNode(query, all.get(String(node.key)))
              : nodeText(node[treeNodeFilterProp] ?? node.title)
                  .toLowerCase()
                  .includes(query.toLowerCase());
          return match || children.length
            ? [{ ...node, children: match ? node.children : children }]
            : [];
        });
      return visit(nodes);
    }, [nodes, query, filterTreeNode, treeNodeFilterProp]);
    const changeOpen = (next: boolean) => {
      setOpen(next);
      onDropdownVisibleChange?.(next);
      onOpenChange?.(next);
      if (!next && searchValue === undefined) {
        setSearch("");
      }
    };
    const selected = all.get(String(current));
    const label = selected?.[treeNodeLabelProp ?? labelField] ?? current;
    const tree = filtered.length ? (
      <Tree
        treeData={filtered}
        selectedKeys={current === undefined ? [] : [current]}
        showIcon={false}
        defaultExpandAll={treeDefaultExpandAll}
        defaultExpandedKeys={treeDefaultExpandedKeys}
        expandedKeys={query ? [...all.keys()] : treeExpandedKeys}
        onExpand={(keys) => onTreeExpand?.(keys)}
        expandAction={treeExpandAction}
        titleRender={(node) =>
          treeTitleRender
            ? treeTitleRender(all.get(String(node.key)))
            : node.title
        }
        onSelect={(keys, info) => {
          if (!info.selected || !keys.length) {
            return;
          }
          const node = all.get(String(keys[0]));
          const next = node?.[valueField] ?? node?.key;
          setValue(next);
          onChange?.(next, [node?.[labelField]], { triggerNode: node });
          onSelect?.(next, node);
          changeOpen(false);
        }}
      />
    ) : (
      <div>{notFoundContent}</div>
    );
    const renderPopup = popupRender ?? dropdownRender;
    return (
      <Popover.Root open={visible} onOpenChange={changeOpen}>
        <div
          className={clsx(
            treeSelectStyles.control,
            className,
            rootClassName,
            treeSelectStyles.select,
          )}
          style={style}
        >
          <Popover.Trigger
            ref={ref}
            id={props.id}
            disabled={disabled}
            role="combobox"
            aria-label={props["aria-label"]}
            aria-expanded={visible}
            aria-controls={popupId}
            aria-haspopup="dialog"
            className={treeSelectStyles.trigger}
          >
            <span
              className={clsx(
                !selected && !current && treeSelectStyles.placeholder,
              )}
            >
              {label || placeholder}
            </span>
            <span aria-hidden="true">⌄</span>
          </Popover.Trigger>
          {allowClear &&
            current !== undefined &&
            current !== "" &&
            !disabled && (
              <button
                type="button"
                aria-label="Clear selection"
                className={treeSelectStyles.clearButton}
                onClick={() => {
                  setValue(undefined);
                  onChange?.(undefined, [], {});
                }}
              >
                ×
              </button>
            )}
        </div>
        <Popover.Portal>
          <Popover.Positioner
            side="bottom"
            align="start"
            sideOffset={4}
            className={treeSelectStyles.positioner}
          >
            <Popover.Popup
              id={popupId}
              className={clsx(
                treeSelectStyles.popup,
                treeSelectStyles.panel,
                popupClassName,
                dropdownClassName,
              )}
              style={dropdownStyle}
            >
              {showSearch && (
                <Input
                  aria-label="Search tree"
                  placeholder={placeholder}
                  value={query}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    onSearch?.(event.target.value);
                  }}
                />
              )}
              {renderPopup ? renderPopup(tree) : tree}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    );
  },
);
