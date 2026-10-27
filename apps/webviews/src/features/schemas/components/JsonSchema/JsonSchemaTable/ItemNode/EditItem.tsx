import React from "react";

import { useMemoizedFn } from "ahooks";
import { produce } from "immer";
import { assign } from "lodash";

import ItemDescription from "../rowItems/ItemDescription";
import ItemKey, { ItemKeyProps } from "../rowItems/ItemKey/ItemKey";
import ModelSettings from "../rowItems/ModelSettings";

type Props = {
  value: any;
  nodeKey: string;
  itemKeyProps: Omit<
    ItemKeyProps,
    | "onAddSiblingNode"
    | "onAddNode"
    | "singleOnly"
    | "mockDisable"
    | "mockValue"
    | "onChangeMock"
  >;
  handleChange: (attr: string, newVal: any) => void;
  enableDelete: boolean;
  handleDeleteNode: () => void;
  handleAddNode: () => void;
  handleSaveChanges: (attr: string, newVal: any) => void;
  handleAddSiblingNode: () => void;
  singleOnly: boolean;
  isModelItem?: boolean;
  onChangeRef: any;
  overrideData: any;
  sortAble?: any;
  linkSchema?: any;
};

const EditItem: React.FC<Props> = (props) => {
  const {
    value,
    // nodeKey,
    itemKeyProps,
    handleChange,
    enableDelete,
    handleDeleteNode,
    handleAddNode,
    handleSaveChanges,
    handleAddSiblingNode,
    singleOnly,
    isModelItem,
    onChangeRef,
    overrideData,
    sortAble,
  } = props;

  // Hide field
  const handleHide = () => {
    onChangeRef(null);
  };

  // Show field
  const handleShow = () => {
    onChangeRef(undefined);
  };

  // Unlink
  const handleCancelLinkItem = () => {
    onChangeRef(value);
  };

  // Link item
  const handleLinkItem = () => {
    onChangeRef(undefined);
  };

  const mergedValue = assign({}, value, overrideData);

  const handleChangeRefValue = useMemoizedFn((key, value) => {
    const newData = produce(mergedValue, (draft: any) => {
      draft[key] = value;
    });
    onChangeRef(newData);
  });

  const mockDisable = ["object", "array", "oneOf", "anyOf", "allOf"].includes(
    itemKeyProps.nodeType,
  );

  const mergedValueOverride = assign({}, mergedValue, overrideData);

  const overrideChange = useMemoizedFn((key, v) => {
    const newData = produce(mergedValueOverride, (draft: any) => {
      draft[key] = v;
    });
    onChangeRef(newData);
  });

  const overrideManageChange = useMemoizedFn((obj: any) => {
    const newData = { ...mergedValue, ...obj };
    onChangeRef(newData);
  });

  return (
    <>
      <ItemKey
        {...itemKeyProps}
        nodeType={itemKeyProps?.nodeType || "string"}
        onAddNode={handleAddNode}
        onAddSiblingNode={handleAddSiblingNode}
        singleOnly={singleOnly}
        sortAble={sortAble}
        value={isModelItem ? mergedValueOverride : value}
        onManageChange={isModelItem ? overrideManageChange : handleSaveChanges}
        onChange={isModelItem ? overrideChange : itemKeyProps?.onChange}
        isModelItem={isModelItem}
        descChange={handleChange}
        mockDisable={mockDisable || itemKeyProps.deepIndex === 0}
        mockValue={mergedValue}
        deepIndex={itemKeyProps.deepIndex}
        overrideData={overrideData}
        onChangeMock={isModelItem ? handleChangeRefValue : handleChange}
      />
      {isModelItem ? (
        <ModelSettings
          value={mergedValue}
          onChange={handleChangeRefValue}
          overrideData={overrideData}
          onHide={handleHide}
          onShow={handleShow}
          onCancelLinkItem={handleCancelLinkItem}
          onLinkItem={handleLinkItem}
        />
      ) : (
        <ItemDescription
          enableDelete={enableDelete}
          onDeleteNode={handleDeleteNode}
          value={value}
          isRequired={itemKeyProps?.isRequired}
          onUpdateRequired={itemKeyProps?.onUpdateRequired}
          nodeKey={itemKeyProps?.nodeKey}
          onChange={handleChange}
          onManageChange={handleSaveChanges}
          singleOnly={singleOnly}
        />
      )}
    </>
  );
};

export default React.memo(EditItem);
