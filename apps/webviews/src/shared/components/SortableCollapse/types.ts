import React from "react";

import { TAG_TYPE_MAP } from "./constants";

export enum DRAG_MODE {
  TOP = "top",
  INSIDE = "inside",
  BOTTOM = "bottom",
}

export type TagType = keyof typeof TAG_TYPE_MAP;

export type SortableCollapseProps<SortItem> = {
  /**Sort list */
  sortItemList: SortItem[];
  /**Container class name */
  wrapClassName?: string;
} & Omit<SortableItemProps<SortItem>, "sortItem">;

export type SortableItemProps<SortItem> = {
  /**Type without children (no arrow shown and cannot be expanded) */
  notChildren?: string[];
  /**Whether sorting is supported */
  sortable?: boolean;
  /**Unique sort key, typically the list's unique key, similar to table's rowKey */
  rowKey: string;
  /**Array index, used to display orderNumber */
  orderNumber?: number;
  /**Sort item */
  sortItem: SortItem;
  /**Whether to show order number; if shown, uses array index */
  showOrderNumber?: boolean;
  /**Whether to show tag; default display uses type field */
  showTag?: boolean;
  /**headerName */
  headerName?: string;
  /**Whether it's a tree structure */
  isTree?: boolean;
  /**Show tools on mouse hover */
  hoverShowTools?: boolean;
  /**Default tools */
  defaultTools?: {
    /**Delete button callback */
    onDelete?: (item: SortItem) => void;
    /**switch key */
    switchKey?: string;
    /**Toggle button callback */
    onSwitchChange?: (checked: boolean, item: SortItem) => void;
  };
  /**Custom hover tools */
  customHoverTools?: (item: SortItem) => React.ReactNode;
  /**Custom tools */
  customTools?: (item: SortItem) => React.ReactNode;
  /**Content */
  customContent?: (item: SortItem) => React.ReactNode;
  /**Custom header */
  customHeader?: (item: SortItem) => React.ReactNode;
  /**Panel collapse callback */
  onCollapseChange?: (activeKey: string, item: SortItem) => void;
  /**Drag end callback function */
  handleDragEnd?: (
    sourceKey: string,
    targetKey: string,
    mode: DRAG_MODE,
  ) => void;
  /**Whether to expand by default */
  isDefaultActiveKeyShowAll?: boolean;
  // Whether to expand items by default
  isDefaultActiveItems?: string[];
  customActiveKey?: string;
};

export type AnyObject = Record<string, any>;
