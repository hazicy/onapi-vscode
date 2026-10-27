import React, { useCallback, useEffect, useRef } from "react";

import { useMemoizedFn } from "ahooks";
import { produce } from "immer";
import { isArray, isNumber } from "lodash-es";

import ItemNode from "../ItemNode/ItemNode";

interface AllOfItemProps {
  deepIndex: number;
  nodeValue: any;
  onChange: (nodeKey: string, val: any) => void;
  linkSchema?: "enable" | "disable";
  parentModels: React.MutableRefObject<string[]>;
}

const AllOfItem: React.FC<AllOfItemProps> = (props) => {
  const { deepIndex, nodeValue, onChange, linkSchema, parentModels } = props;

  // Ensure latest value is accessible when modifying data
  const refData = useRef(null);
  useEffect(() => {
    refData.current = isArray(nodeValue?.allOf) ? nodeValue.allOf : [];
  }, [nodeValue]);

  // Modify content
  const handleChange = useCallback((attrName: any, newVal: any) => {
    const preData: any = refData.current;
    const newData = produce(preData, (draft: any) => {
      draft[attrName] = newVal;
    });
    onChange("allOf", newData);
  }, []);

  // Delete attribute
  const handleDeleteNode = useCallback((removeIndex: any) => {
    if (!isNumber(removeIndex)) {
      return;
    }
    const preData = refData.current;
    const newData = produce(preData, (draft: any) => {
      draft.splice(removeIndex, 1);
    });
    onChange("allOf", newData);
  }, []);

  const dataList = isArray(nodeValue?.allOf) ? nodeValue.allOf : [];

  const handleAddSiblingNode = useMemoizedFn((nodeKey) => {
    const newData = produce(dataList, (draft: any) => {
      draft.splice(nodeKey + 1, 0, { type: "string" });
    });
    onChange("allOf", newData);
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
            linkSchema,
            parentModels,
          }}
        />
      ))}
    </>
  );
};

export default React.memo(AllOfItem);
