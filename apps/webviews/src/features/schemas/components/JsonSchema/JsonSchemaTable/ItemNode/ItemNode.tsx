import styles from "../JsonSchemaTable.module.css";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useMemoizedFn } from "ahooks";
import clsx from "clsx";
import { produce } from "immer";
import {
  isArray,
  isEmpty,
  isNumber,
  isObject,
  isPlainObject,
  isString,
  isUndefined,
  trim,
} from "lodash-es";

import { getItemType } from "../common";
import { ItemNodeProps } from "../interface";
import NodeList from "../NodeList/NodeList";
import DataModel from "./DataModel";
import EditRow from "./EditItem";
import EmptyRow from "./Empty";

const ItemNode: React.FC<ItemNodeProps> = (props) => {
  const {
    value,
    nodeKey,
    onChange = () => undefined,
    onNodeKeyChange = () => undefined,
    deepIndex,
    readOnly,
    isRequired,
    onSetRequired = () => undefined,
    onDeleteNode,
    enableDelete = true,
    onAddSiblingNode = () => undefined,
    onLinkSchema = () => undefined,
    singleOnly = false,
    onCancelLinkSchema,
    isModelItem,
    onChangeRefs,
    overrideData,
    linkSchema,
    parentModels,
    sortAble,
    DragHandle,
    mergedValue,
  } = props;
  const { t } = useTranslation();
  const [expand, setExpand] = useState(true);

  const nodeType = getItemType(isModelItem ? mergedValue : value);

  const txtKeyRef = React.useRef<any>(null);

  // Modify single attribute
  const handleChange = useMemoizedFn((attr: string, newVal: any) => {
    const preData = isObject(value) ? value : {};
    const newObject = produce(preData, (draft: any) => {
      draft[attr] = newVal;
      if (attr === "type") {
        delete draft.mock;
      }
    });
    onChange(nodeKey, newObject);
  });

  // Modify multiple attributes
  const handleMultiChange = useMemoizedFn((params: [string, any]) => {
    const preData = isObject(value) ? value : {};
    if (isArray(params) && (isString(nodeKey) || isNumber(nodeKey))) {
      const newObject = produce(preData, (draft: any) => {
        params.forEach(([key, newVal]) => {
          draft[key] = newVal;
        });
      });
      onChange(nodeKey, newObject);
    }
  });

  // Set/unset required
  const handleSetRequired = useMemoizedFn((required) => {
    onSetRequired(nodeKey, required);
  });

  const handleSaveChanges = useMemoizedFn((newObject) => {
    onChange(nodeKey, newObject);
  });

  // Delete node
  const handleDeleteNode = useMemoizedFn(() => {
    if (onDeleteNode) {
      onDeleteNode(nodeKey, false);
    }
  });

  // Delete model reference
  const handleDeleteModel = useMemoizedFn(() => {
    if (onDeleteNode) {
      onDeleteNode(nodeKey, true);
    }
  });

  // Add new node
  const handleAddNode = useMemoizedFn(() => {
    const preData = isPlainObject(value) ? value : {};
    if (nodeType === "object") {
      const initData = isPlainObject(preData?.properties)
        ? preData
        : { ...preData, properties: {} };

      // If existing key with empty value exists, prevent adding
      if (
        Object.keys(initData?.properties)?.some((item) => isEmpty(trim(item)))
      ) {
        return;
      }

      const newKey = "";
      const newObject = produce(initData, (draft: any) => {
        draft.properties[newKey] = {
          type: "string",
          ONAPI_NEW_EMPTY_ROW: true,
        };
      });
      onChange(nodeKey, newObject);
    }
    if (nodeType === "array") {
      if (!isUndefined(preData?.items)) {
        return;
      }
      const newObject = produce(preData, (draft: any) => {
        draft.items = {
          type: "string",
          title: "Items",
        };
      });
      onChange(nodeKey, newObject);
    }
    if (nodeType === "oneOf") {
      const initData = isArray(preData?.oneOf)
        ? preData
        : { ...preData, oneOf: [] };
      const newObject = produce(initData, (draft: any) => {
        draft.oneOf.push({
          type: "string",
        });
      });
      onChange(nodeKey, newObject);
    }
    if (nodeType === "anyOf") {
      const initData = isArray(preData?.anyOf)
        ? preData
        : { ...preData, anyOf: [] };
      const newObject = produce(initData, (draft: any) => {
        draft.anyOf.push({
          type: "string",
        });
      });
      onChange(nodeKey, newObject);
    }
    if (nodeType === "allOf") {
      const initData = isArray(preData?.allOf)
        ? preData
        : { ...preData, allOf: [] };
      const newObject = produce(initData, (draft: any) => {
        draft.allOf.push({
          type: "string",
        });
      });
      onChange(nodeKey, newObject);
    }
    setExpand(true);
  });

  const handleAddSiblingNode = useMemoizedFn(() => {
    onAddSiblingNode(nodeKey);
  });

  const handleEmptyKeyChange = useMemoizedFn(
    (oldKey: string, newKey: string) => {
      onNodeKeyChange(oldKey, newKey);
      setTimeout(() => {
        txtKeyRef.current?.focus();
      }, 0);
    },
  );

  const handleLinkSchema = useMemoizedFn((schema: any) => {
    onLinkSchema(nodeKey, schema);
  });

  const handleCancelLinkSchema = useMemoizedFn(() => {
    if (onCancelLinkSchema) {
      onCancelLinkSchema(nodeKey);
    }
  });

  const handleChangeRef = (...args: any) => {
    // This calls the ONAPI_OVERRIDES modification method
    onChangeRefs.apply(null, [nodeKey, ...args]);
  };

  const itemKeyProps = {
    nodeType,
    nodeKey,
    deepIndex,
    onNodeKeyChange,
    readOnly,
    expand,
    setExpand,
    onChange: handleChange,
    isRequired,
    onUpdateRequired: handleSetRequired,
    txtKeyRef,
    DragHandle,
  };

  const isEmptyJson = useMemo(() => {
    const isEmptyObject =
      value?.type === "object" && isEmpty(value?.properties);
    const isEmptyArray = value?.type === "array" && isEmpty(value?.items);
    const isEmptyOneOf = value?.type === "oneOf" && isEmpty(value?.oneOf);
    const isEmptyAnyOf = value?.type === "anyOf" && isEmpty(value?.anyOf);
    const isEmptyAllOf = value?.type === "allOf" && isEmpty(value?.allOf);
    const isEmptyRef =
      isUndefined(value?.ONAPI_REFS) ||
      Object.keys(value?.ONAPI_REFS).length === 0;

    return (
      deepIndex === 0 &&
      isEmptyRef &&
      (isEmptyObject ||
        isEmptyArray ||
        isEmptyOneOf ||
        isEmptyAnyOf ||
        isEmptyAllOf)
    );
  }, [value, deepIndex]);
  if (value === undefined) {
    return <></>;
  }

  if (value.type === "dataModel") {
    return (
      <DataModel
        {...{
          deepIndex,
          nodeKey,
          nodeValue: value,
          onLinkSchema: handleLinkSchema,
          onDeleteModel: handleDeleteModel,
          onCancelLinkSchema: handleCancelLinkSchema,
          onChangeRefs: handleChangeRef,
          linkSchema,
          parentModels,
        }}
      />
    );
  }

  const renderRowItem = (value: any) => {
    if (isUndefined(value?.ONAPI_NEW_EMPTY_ROW)) {
      return (
        <EditRow
          {...{
            value,
            nodeKey,
            itemKeyProps,
            handleChange,
            enableDelete,
            handleDeleteNode,
            handleAddNode,
            handleSaveChanges,
            handleAddSiblingNode,
            singleOnly,
            isModelItem,
            onChangeRef: handleChangeRef,
            overrideData,
            sortAble,
          }}
        />
      );
    }
    return (
      <EmptyRow
        {...{
          deepIndex,
          nodeKey,
          onNodeKeyChange: handleEmptyKeyChange,
          onDeleteNode: handleDeleteNode,
          onAddSiblingNode: handleAddSiblingNode,
          onLinkSchema: handleLinkSchema,
        }}
      />
    );
  };

  return (
    <>
      <div
        className={clsx({
          [styles.tableTr]: true,

          [styles.isHidden]: overrideData === null,
        })}
      >
        {renderRowItem(value)}
      </div>
      {isEmptyJson && (
        <div className={styles.emptyRowPanel}>
          <span className={styles.emptyRowTip}>
            {t("common.schema.no_field")}
          </span>
          <span onClick={handleAddNode} className={styles.btnAddItem}>
            {t("common.schema.please_add")}
          </span>
        </div>
      )}
      {(expand || value.type === "dataModel") && (
        <NodeList
          {...{
            deepIndex,
            nodeKey,
            nodeType,
            nodeValue: value,
            onChange: handleChange,
            onMultiChange: handleMultiChange,
            onLinkSchema: handleLinkSchema,
            onDeleteModel: handleDeleteModel,
            onCancelLinkSchema: handleCancelLinkSchema,
            onChangeRefs: handleChangeRef,
            linkSchema,
            parentModels,
          }}
        />
      )}
    </>
  );
};

export default React.memo(ItemNode);
