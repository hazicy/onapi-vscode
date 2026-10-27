import React from "react";

import AllOfList from "./AllOf";
import AnyOfList from "./AnyOf";
import ArrayList from "./Array";
import ObjectList from "./Object";
import OneOfList from "./OneOf";

interface NodeListProps {
  deepIndex: number;
  nodeKey: string;
  nodeValue: any;
  onChange: (nodeKey: string, newVal: any) => void;
  nodeType: string;
  onMultiChange: (params: any) => void;
  onLinkSchema: (model: any) => void;
  onDeleteModel: () => void;
  onCancelLinkSchema: () => void;
  onChangeRefs: any;
  linkSchema?: "enable" | "disable";
  parentModels: React.MutableRefObject<any[]>;
}

const NodeList: React.FC<NodeListProps> = (props) => {
  const {
    deepIndex,
    nodeType,
    nodeValue,
    onChange,
    onMultiChange,
    linkSchema,
    parentModels,
  } = props;

  return (
    <>
      {nodeType === "array" && (
        <ArrayList
          {...{
            deepIndex,
            nodeValue,
            onChange,
            onMultiChange,
            linkSchema,
            parentModels,
          }}
        />
      )}
      {nodeType === "object" && (
        <ObjectList
          {...{
            deepIndex,
            nodeValue,
            onChange,
            onMultiChange,
            linkSchema,
            parentModels,
          }}
        />
      )}
      {nodeType === "oneOf" && (
        <OneOfList
          {...{
            deepIndex,
            nodeValue,
            onChange,
            onMultiChange,
            linkSchema,
            parentModels,
          }}
        />
      )}
      {nodeType === "anyOf" && (
        <AnyOfList
          {...{
            deepIndex,
            nodeValue,
            onChange,
            onMultiChange,
            linkSchema,
            parentModels,
          }}
        />
      )}
      {nodeType === "allOf" && (
        <AllOfList
          {...{
            deepIndex,
            nodeValue,
            onChange,
            onMultiChange,
            linkSchema,
            parentModels,
          }}
        />
      )}
    </>
  );
};

export default React.memo(NodeList);
