import React from "react";

export interface ItemNodeProps {
  value: any;
  nodeKey: any;
  onChange: any;
  onNodeKeyChange?: (oldKey: string, newKey: string) => void;
  deepIndex: number;
  readOnly: boolean;
  isRequired?: boolean;
  onSetRequired?: (nodeKey: string, val: boolean) => void;
  // onDeleteNode?: (key?: string | number, is_model?: boolean) => void;
  onDeleteNode?: any;
  enableDelete?: boolean; // Whether deletion is allowed
  onAddNode?: (key: string) => void;
  onAddSiblingNode?: (nodeKey: string) => void;
  onLinkSchema?: (nodeKey: string, data: any) => void;
  onCancelLinkSchema?: (nodeKey: string) => void;
  singleOnly?: boolean; // Only one sibling node allowed at current level
  isModelItem?: boolean; // Whether it is an item within a model
  // onChangeRefs?: (nodeKey: string, newVal: any) => void;
  onChangeRefs?: any;
  overrideData?: any;
  linkSchema?: any;
  parentModels: React.MutableRefObject<string[]>;
  sortAble?: boolean | undefined; // Whether drag sorting is allowed
  DragHandle?: (fn: any) => void;
  mergedValue?: any;
}
