import React, { useCallback } from "react";

import isObject from "lodash/isObject";

import ItemNode from "../ItemNode";

interface ArrayItemProps {
  deepIndex: number;
  nodeValue: any;
  onChange: (nodeKey: string, val: any) => void;
  linkSchema?: "enable" | "disable";
  parentModels: React.MutableRefObject<string[]>;
}

const ArrayItem: React.FC<ArrayItemProps> = (props) => {
  const { deepIndex, nodeValue, onChange, linkSchema, parentModels } = props;

  // Delete attribute
  const handleDeleteNode = useCallback(() => {
    onChange("items", undefined);
  }, []);

  return (
    <>
      {isObject(nodeValue?.items) && (
        <ItemNode
          {...{
            value: nodeValue.items,
            nodeKey: "items",
            isRequired: false,
            readOnly: true,
            deepIndex: deepIndex + 1,
            onNodeKeyChange: () => undefined,
            onDeleteNode: handleDeleteNode,
            onChange,
            enableDelete: true,
            singleOnly: true,
            linkSchema,
            parentModels,
          }}
        />
      )}
    </>
  );
};

export default React.memo(ArrayItem);
