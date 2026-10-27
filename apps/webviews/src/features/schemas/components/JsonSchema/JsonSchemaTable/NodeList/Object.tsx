import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { message } from "@/shared/ui/base";

import type { DragEndEvent } from "@dnd-kit/core";
import { useMemoizedFn } from "ahooks";
import { snowflakeId } from "@onapi/domain/utils/data-tools";
import { produce } from "immer";
import {
  cloneDeep,
  isArray,
  isEmpty,
  isFunction,
  isPlainObject,
  isString,
  isUndefined,
  omit,
  trim,
} from "lodash-es";

import { useSchemaContext } from "../context";
import { SortableList } from "./Sortable";

interface ObjectItemProps {
  deepIndex: number;
  nodeValue: any;
  onChange?: (nodeKey: string, val: any) => void;
  onMultiChange?: any;
  linkSchema?: "enable" | "disable";
  parentModels: React.MutableRefObject<string[]>;
}

const ObjectItem: React.FC<ObjectItemProps> = (props) => {
  const { t } = useTranslation();
  const {
    deepIndex,
    nodeValue,
    onChange,
    onMultiChange,
    linkSchema,
    parentModels,
  } = props;

  const { schemaData, parseModelToJsonSchema }: any = useSchemaContext();

  // Required field list
  const requiredKeys = isArray(nodeValue?.required) ? nodeValue.required : [];

  // Ensure order is correct when modifying key
  const itemKeys = isArray(nodeValue?.ONAPI_ORDERS)
    ? nodeValue.ONAPI_ORDERS
    : [];

  // Properties content under object
  const propertiesData = isPlainObject(nodeValue?.properties)
    ? nodeValue.properties
    : {};

  useEffect(() => {
    const tempKeys = cloneDeep(itemKeys);
    const currentObjectKeys = Object.keys(propertiesData);
    if (nodeValue?.ONAPI_IS_MODEL) {
      return;
    }
    let isEqual = true;
    currentObjectKeys.forEach((item) => {
      if (tempKeys.includes(item) === false) {
        isEqual = false;
        tempKeys.push(item);
      }
    });
    if (!isEqual) {
      if (isFunction(onChange)) {
        onChange("ONAPI_ORDERS", tempKeys);
      }
    }
  }, [propertiesData]);

  // Modify value
  const handleChange = useMemoizedFn((attrName, newVal) => {
    const newData = produce(propertiesData, (draft: any) => {
      draft[attrName] = newVal;
    });
    if (isFunction(onChange)) {
      onChange("properties", newData);
    }
  });

  // Modify key
  const handleNodeKeyChange = useMemoizedFn((preKey, newKey) => {
    // If key already exists, operation is forbidden
    if (itemKeys.includes(newKey)) {
      message.destroy();
      message.warning(t("supplement.same_key"));
      return;
    }

    // Update latest key list to ensure correct sorting
    const newKeyList = itemKeys.map((keyItem: any) => {
      if (keyItem === preKey) {
        return newKey;
      }
      return keyItem;
    });

    // Update required field info
    const newRequired = requiredKeys?.map((reqKey: string) => {
      if (reqKey === preKey) {
        return newKey;
      }
      return reqKey;
    });

    // Key modification operation
    const newData = produce(propertiesData, (draft: any) => {
      const entriesList = Object.entries(draft);
      const newList = entriesList.map(([key, data]: [string, any]) => {
        if (key !== preKey) {
          return [key, data];
        }

        // If ONAPI_NEW_EMPTY_ROW exists, delete it
        if (!isUndefined(data?.ONAPI_NEW_EMPTY_ROW)) {
          data = omit(data, ["ONAPI_NEW_EMPTY_ROW"]);
        }

        return [newKey, data];
      });
      return Object.fromEntries(newList);
    });
    onMultiChange([
      ["required", newRequired],
      ["properties", newData],
      ["ONAPI_ORDERS", newKeyList],
    ]);
  });

  // Handle sorting issue after modifying key
  const listData = useMemo(() => {
    const resultList: any = [];

    if (!isArray(itemKeys) || !isPlainObject(nodeValue?.properties)) {
      if (!(isArray(nodeValue?.properties) && isEmpty(nodeValue?.properties))) {
        return [];
      }
    }

    itemKeys.forEach((key: string) => {
      const itemData = nodeValue?.properties[key];
      if (isPlainObject(itemData)) {
        if (isString(itemData?.ref)) {
          const md5Key = snowflakeId();
          const refModelValue = {
            ONAPI_ORDERS: [md5Key],
            ONAPI_REFS: {
              [md5Key]: {
                ref: itemData?.ref,
              },
            },
            properties: {},
            type: "object",
          };
          resultList.push([key, refModelValue]);
          return;
        }
        resultList.push([key, itemData]);
        return;
      }
      const refData = nodeValue?.ONAPI_REFS?.[key];
      const schemaKey = nodeValue?.ONAPI_REFS?.[key]?.ref;

      const modelData = schemaData?.[schemaKey];
      if (isPlainObject(modelData) && isPlainObject(modelData?.schema)) {
        const modelSchema = produce(modelData?.schema, (draft: any) => {
          draft.type = "dataModel";
          draft.ONAPI_MODEL_ID = schemaKey;
          draft.ONAPI_MODEL_KEY = key;
          draft.refData = refData;
        });
        resultList.push([key, modelSchema]);
      }
    });

    return resultList;
  }, [itemKeys, nodeValue, schemaData, propertiesData]);

  // Modify required selection state
  const handleSetRequired = useMemoizedFn((key: string, required: boolean) => {
    // toObject
    const KeyData: { [key: string]: boolean } = {};
    requiredKeys.forEach((item: any) => {
      KeyData[item] = true;
    });
    if (required === true) {
      KeyData[key] = true;
    } else {
      KeyData[key] = false;
    }
    const newList: Array<string> = [];
    Object.entries(KeyData).map(([key, value]) => {
      if (value === true) {
        newList.push(key);
      }
    });
    if (isFunction(onChange)) {
      onChange("required", newList);
    }
  });

  // Delete attribute
  const handleDeleteNode = useMemoizedFn((keyRemove, is_model = false) => {
    // Update latest key list to ensure correct sorting
    const newKeyList = itemKeys.filter((itemKey: any) => itemKey !== keyRemove);
    // Update required field info
    const newRequired = requiredKeys.filter((item: any) => item !== keyRemove);

    // Delete object
    const newData = produce(propertiesData, (draft: any) => {
      delete draft[keyRemove];
    });
    let multiChanges = [
      ["required", newRequired],
      ["properties", newData],
      ["ONAPI_ORDERS", newKeyList],
    ];

    const preRefValues = isPlainObject(nodeValue?.ONAPI_REFS)
      ? nodeValue?.ONAPI_REFS
      : {};
    if (is_model) {
      multiChanges = multiChanges.concat([
        ["ONAPI_REFS", omit(preRefValues, keyRemove)],
      ]);
    }

    onMultiChange(multiChanges);
  });

  // Add sibling node
  const handleAddSiblingNode = useMemoizedFn((nodeKey) => {
    if (!isArray(itemKeys)) {
      return;
    }

    // If existing key with empty value exists, prevent adding
    if (itemKeys?.some((item) => isEmpty(trim(item)))) {
      return;
    }

    const dataIndex = itemKeys.findIndex((item) => item === nodeKey);
    if (dataIndex === -1) {
      return;
    }
    const newKey = "";
    const newProperties = produce(propertiesData, (draft: any) => {
      const entriesList = Object.entries(draft);
      entriesList.splice(dataIndex + 1, 0, [
        newKey,
        {
          type: "string",
          ONAPI_NEW_EMPTY_ROW: true,
        },
      ]);
      return Object.fromEntries(new Map(entriesList));
    });
    const newKeys = cloneDeep(itemKeys);
    newKeys.splice(dataIndex + 1, 0, newKey);
    onMultiChange([
      ["properties", newProperties],
      ["ONAPI_ORDERS", newKeys],
    ]);
  });

  // Link json-schema
  const handleLinkSchema = useMemoizedFn(
    async (nodeKey: string, dataModel: any) => {
      if (!isPlainObject(dataModel)) {
        return;
      }

      // Data model cannot be referenced multiple times
      if (isPlainObject(nodeValue?.ONAPI_REFS)) {
        const modelIds = Object.values(nodeValue?.ONAPI_REFS).map(
          (item: any) => item?.ref,
        );
        if (modelIds.includes(dataModel?.model_id)) {
          message.warning(t("supplement.wont_link_more_schema"));
          return;
        }
      }

      const newData = produce(propertiesData, (draft: any) => {
        delete draft[nodeKey];
      });
      const dataIndex = itemKeys.findIndex((item: any) => item === nodeKey);
      if (dataIndex === -1) {
        return;
      }
      const newOrderKeys = [...itemKeys];
      const newRefKey = isEmpty(nodeKey) ? snowflakeId() : nodeKey;
      newOrderKeys.splice(dataIndex, 1, newRefKey);

      const preRefValues = isPlainObject(nodeValue?.ONAPI_REFS)
        ? nodeValue?.ONAPI_REFS
        : {};
      const newRefs = produce(preRefValues, (draft: any) => {
        draft[newRefKey] = {
          ref: dataModel?.model_id,
        };
      });
      onMultiChange([
        ["properties", newData],
        ["ONAPI_ORDERS", newOrderKeys],
        ["ONAPI_REFS", newRefs],
      ]);
    },
  );

  // Unlink Json-schema
  const handleCancelLinkSchema = useMemoizedFn(async (nodeKey: string) => {
    const schemaKey = nodeValue?.ONAPI_REFS?.[nodeKey]?.ref;
    const modelJson = await parseModelToJsonSchema(
      schemaData?.[schemaKey]?.schema ?? {},
      [],
    );
    const modelProperties = modelJson?.properties ?? {};
    const orderIndex = itemKeys.findIndex((item: any) => item === nodeKey);

    const newData = produce(propertiesData, (draft: any) => {
      Object.entries(modelProperties).forEach(([key, value]) => {
        draft[key] = value;
      });
    });

    const newOrderKeys = [...itemKeys];
    const refOrders = schemaData?.[schemaKey]?.schema?.ONAPI_ORDERS
      ? schemaData?.[schemaKey]?.schema?.ONAPI_ORDERS
      : Object.keys(modelProperties);
    newOrderKeys.splice(orderIndex, 1, ...refOrders);
    const newRefs = produce(nodeValue?.ONAPI_REFS ?? {}, (draft: any) => {
      delete draft[nodeKey];
    });
    const multiChanges = [
      ["properties", newData],
      ["ONAPI_ORDERS", newOrderKeys],
      ["ONAPI_REFS", newRefs],
    ];
    onMultiChange(multiChanges);
  });

  // Override data model field
  const handleChangeRefs = useMemoizedFn(
    (modelKey: string, rowKey: string, newVal: any) => {
      const preRefValues = isPlainObject(nodeValue?.ONAPI_REFS)
        ? nodeValue?.ONAPI_REFS
        : {};
      const newRefs = produce(preRefValues, (draft: any) => {
        if (!isPlainObject(draft[modelKey].ONAPI_OVERRIDES)) {
          draft[modelKey].ONAPI_OVERRIDES = {};
        }
        if (isUndefined(newVal)) {
          delete draft[modelKey].ONAPI_OVERRIDES[rowKey];
        } else {
          draft[modelKey].ONAPI_OVERRIDES[rowKey] = newVal;
        }
      });

      onMultiChange([["ONAPI_REFS", newRefs]]);
    },
  );

  const handleItemSortEnd = useMemoizedFn(({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      const oldIndex = listData.findIndex(
        ([itemKey]: any) => active.id === itemKey,
      );
      const newIndex = listData.findIndex(
        ([itemKey]: any) => over?.id === itemKey,
      );

      if (oldIndex > -1 && newIndex > -1) {
        const newOrders = produce<string[]>(itemKeys, (draft) => {
          const sortValue = itemKeys[oldIndex];
          draft.splice(oldIndex, 1);
          draft.splice(newIndex, 0, sortValue);
        });
        const newProperties = produce(propertiesData, (draft: any) => {
          const newList: any = [];
          newOrders.forEach((dataKey) => {
            newList.push([dataKey, draft[dataKey]]);
          });
          return Object.fromEntries(newList);
        });
        const multiChanges = [
          ["properties", newProperties],
          ["ONAPI_ORDERS", newOrders],
        ];
        onMultiChange(multiChanges);
      }
    }
  });

  return (
    <SortableList
      {...{
        listData,
        nodeProps: {
          onSetRequired: handleSetRequired,
          readOnly: false,
          deepIndex: deepIndex + 1,
          onNodeKeyChange: handleNodeKeyChange,
          onChange: handleChange,
          onDeleteNode: handleDeleteNode,
          onAddSiblingNode: handleAddSiblingNode,
          onLinkSchema: handleLinkSchema,
          onCancelLinkSchema: handleCancelLinkSchema,
          singleOnly: false,
          onChangeRefs: handleChangeRefs,
          linkSchema,
          parentModels,
          sortAble: true,
          requiredKeys,
        },
        onDragEnd: handleItemSortEnd,
        axis: "y",
        lockAxis: "y",
        distance: 2,
        lockToContainerEdges: true,
        useDragHandle: true,
      }}
    />
  );
};

export default React.memo(ObjectItem);
