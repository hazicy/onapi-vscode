import React, { useCallback, useEffect, useRef } from "react";

import { useMemoizedFn } from "ahooks";
import { produce } from "immer";
import { isArray, isNumber } from "lodash";

import ItemNode from "../ItemNode/ItemNode";

interface OneOfItemProps {
  deepIndex: number;
  nodeValue: any;
  onChange: (nodeKey: string, val: any) => void;
  parentModels: React.MutableRefObject<string[]>;
}

const OneOfItem: React.FC<OneOfItemProps> = (props) => {
  const { deepIndex, nodeValue, onChange, parentModels } = props;

  // Ensure latest value is accessible when modifying data
  const refData = useRef(null);
  useEffect(() => {
    refData.current = isArray(nodeValue?.oneOf) ? nodeValue.oneOf : [];
  }, [nodeValue]);

  // Modify content
  const handleChange = useMemoizedFn((attrName, newVal) => {
    const preData = isArray(nodeValue?.oneOf) ? nodeValue.oneOf : [];
    const newData = produce(preData, (draft: any) => {
      draft[attrName] = newVal;
    });
    onChange("oneOf", newData);
  });

  // Delete attribute
  const handleDeleteNode = useCallback((removeIndex: any) => {
    if (!isNumber(removeIndex)) {
      return;
    }
    const preData = refData.current;
    const newData = produce(preData, (draft: any) => {
      draft.splice(removeIndex, 1);
    });
    onChange("oneOf", newData);
  }, []);

  const dataList = isArray(nodeValue?.oneOf) ? nodeValue.oneOf : [];

  const handleAddSiblingNode = useMemoizedFn((nodeKey) => {
    const newData = produce(dataList, (draft: any) => {
      draft.splice(nodeKey + 1, 0, { type: "string" });
    });
    onChange("oneOf", newData);
  });

  return (
    <>
      {dataList.map((item: any, index: number) => (
        <ItemNode
          key={index}
          {...{
            value: item,
            nodeKey: index,
            readOnly: true,
            deepIndex: deepIndex + 1,
            onNodeKeyChange: () => void 0,
            onChange: handleChange,
            onDeleteNode: handleDeleteNode,
            onAddSiblingNode: handleAddSiblingNode,
            parentModels,
          }}
        />
      ))}
    </>
  );
};

export default React.memo(OneOfItem);
