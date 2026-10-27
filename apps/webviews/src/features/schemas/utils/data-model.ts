import { snowflakeId } from "@onapi/http-model/utils/data-tools";
import { produce } from "immer";
import { diff } from "jsondiffpatch";
import {
  cloneDeep,
  isArray,
  isEmpty,
  isNull,
  isPlainObject,
  isString,
  isUndefined,
  merge,
} from "lodash-es";

import { DIFF_DATA_KEYS } from "@/features/schemas/constants/schemas";
import {
  SchemaObj,
  TYPE_DIFF_OBJECT_JSON,
  TYPE_PARSE_MODEL_TO_JSON_SCHEMA,
} from "@/features/schemas/types";

export const trimSchema = (schema: SchemaObj) => {
  const result = produce(schema, (draft) => {
    const preProptosis = isPlainObject(draft?.properties)
      ? draft.properties
      : {};

    // Help php resolve the issue where $schema cannot be parsed
    if (!isUndefined(draft?.$schema)) {
      delete draft?.$schema;
    }

    for (const key in preProptosis) {
      const dataItem = draft?.properties[key];
      if (dataItem.type === "object") {
        draft.properties[key] = trimSchema(preProptosis[key]);
        continue;
      }
      if (
        dataItem.type === "array" &&
        isPlainObject(draft.properties[key]?.items)
      ) {
        draft.properties[key].items = trimSchema(preProptosis[key]?.items);
        continue;
      }

      if (isArray(dataItem?.oneOf)) {
        dataItem?.oneOf?.forEach((item: any, index: number) => {
          if (item.type === "object") {
            draft.properties[key].oneOf[index] = trimSchema(item);
          }
          if (item.type === "array") {
            draft.properties[key].oneOf[index].items = trimSchema(item.items);
          }
        });
        continue;
      }
      if (isArray(dataItem?.anyOf)) {
        dataItem?.anyOf?.forEach((item: any, index: number) => {
          if (item.type === "object") {
            draft.properties[key].anyOf[index] = trimSchema(item);
          }
          if (item.type === "array") {
            draft.properties[key].anyOf[index].items = trimSchema(item.items);
          }
        });
        continue;
      }
      if (isArray(dataItem?.allOf)) {
        dataItem?.allOf?.forEach((item: any, index: number) => {
          if (item.type === "object") {
            draft.properties[key].allOf[index] = trimSchema(item);
          }
          if (item.type === "array") {
            draft.properties[key].allOf[index].items = trimSchema(item.items);
          }
        });
        continue;
      }

      if (isEmpty(key)) {
        delete draft?.properties[key];
      }
    }
    if (isArray(draft?.ONAPI_ORDERS)) {
      const emptyIndex = draft?.ONAPI_ORDERS?.indexOf("");
      if (emptyIndex !== -1) {
        draft.ONAPI_ORDERS.splice(emptyIndex, 1);
      }
    }
  });
  return result;
};

// Convert data model to json-schema
export const parseModelToJsonSchema: TYPE_PARSE_MODEL_TO_JSON_SCHEMA = async (
  model: any,
  parentModels = [],
  schemasBaseData: any,
) => {
  const result = cloneDeep(model);
  if (isString(result?.ref)) {
    const md5Key = snowflakeId();
    result.ONAPI_ORDERS = [md5Key];
    result.ONAPI_REFS = {
      [md5Key]: {
        ref: result?.ref,
      },
    };
    result.properties = {};
    result.type = "object";
    delete result.ref;
  }
  if (isArray(result?.type) && result?.type.length > 0) {
    result.type = result.type[0];
  }
  if (result?.type === "array") {
    result.items = await parseModelToJsonSchema(
      result.items,
      parentModels,
      schemasBaseData,
    );
  }
  if (result?.type !== "object") {
    return result;
  }

  // Read all ref information from the database
  const refData: any = {};

  const nodeRefsData = result?.ONAPI_REFS || {};
  for (const key in nodeRefsData) {
    const data = nodeRefsData[key];
    if (!isString(data?.ref)) {
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    let dataModel: any = {};
    if (data?.ref) {
      // getModelItem - not sure if it fetches all or just the bottom level
      dataModel = schemasBaseData?.[data?.ref];
    }
    const overrideData = data?.ONAPI_OVERRIDES ?? {};
    if (parentModels?.includes(dataModel?.model_id)) {
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const newData: any = await parseModelToJsonSchema(
      dataModel?.schema || {},
      [...parentModels, dataModel?.model_id],
      schemasBaseData,
    );
    newData.properties = merge(newData.properties || {}, overrideData);

    // Reorder
    if (isArray(newData?.ONAPI_ORDERS) && newData.ONAPI_ORDERS.length > 0) {
      const newProperties = [];
      // eslint-disable-next-line
      for (const dataKey of newData?.ONAPI_ORDERS) {
        newProperties.push([dataKey, newData?.properties?.[dataKey]]);
      }
      newData.properties = Object.fromEntries(newProperties);
    }
    delete newData.ONAPI_OVERRIDES;
    delete newData.ONAPI_REFS;
    delete newData.ONAPI_ORDERS;
    refData[key] = newData;
  }

  if (isArray(result?.ONAPI_ORDERS) && result.ONAPI_ORDERS.length > 0) {
    const newProperties = [];
    let requireds = isArray(result?.required) ? result.required : [];
    // eslint-disable-next-line
    for (const key of result?.ONAPI_ORDERS) {
      if (isPlainObject(refData?.[key]?.properties)) {
        Object.entries(refData?.[key]?.properties).forEach(
          ([refKey, refValue]) => {
            newProperties.push([refKey, refValue]);
          },
        );
      } else if (isPlainObject(result?.properties?.[key])) {
        newProperties.push([key, result?.properties?.[key]]);
      }

      const required = refData?.[key]?.required;
      if (isArray(required)) {
        requireds = requireds.concat(required);
      }
    }
    result.required = requireds;
    result.properties = Object.fromEntries(newProperties);
  }

  // Recursively parse internal elements again
  for (const modelKey in result.properties) {
    const modelData = result.properties[modelKey];
    // eslint-disable-next-line no-await-in-loop
    result.properties[modelKey] = await parseModelToJsonSchema(
      modelData,
      parentModels,
      schemasBaseData,
    );
    if (isNull(result.properties[modelKey])) {
      delete result.properties[modelKey];
    }
  }
  delete result.ONAPI_ORDERS;
  delete result.ONAPI_REFS;
  delete result.ONAPI_OVERRIDES;
  return result;
};

export const TreeTrans = (data: any[]) => {
  try {
    const res = data.reduce((p, i) => {
      p[i.model_id] = i;
      return p;
    }, {});
    return res;
  } catch (err) {
    return {};
  }
};

// Compare if Opens data is consistent with model data
export const diffObjectJSON: TYPE_DIFF_OBJECT_JSON = (
  sourceData: any,
  opensData: any,
) => {
  if (!isPlainObject(sourceData)) {
    return 1;
  }

  const changedItem = [];
  Object.values(DIFF_DATA_KEYS).forEach((keyPath: string) => {
    const localVal = sourceData?.[keyPath];
    const opensVal = opensData?.[keyPath];
    const delta_diffs = diff(opensVal, localVal);
    if (delta_diffs) {
      changedItem.push(true);
    }
  });

  if (changedItem.length > 0) {
    return 1;
  }
  return -1;
};
