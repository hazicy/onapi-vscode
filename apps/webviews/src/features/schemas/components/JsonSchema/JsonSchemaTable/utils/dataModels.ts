import { snowflakeId } from "@onapi/http-model/utils/data-tools";
import {
  cloneDeep,
  isArray,
  isNull,
  isPlainObject,
  isString,
  merge,
} from "lodash";

function dataModels(models: any) {
  const getModelItem: (id: string) => any = (ref_id) => {
    return models?.[ref_id];
  };

  // Convert data model to json-schema
  const parseModelToJsonSchema = async (model: any, parentModels: any = []) => {
    const result: any = cloneDeep(model);
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
      result.items = await parseModelToJsonSchema(result.items, parentModels);
    }
    if (result?.type !== "object") {
      return result;
    }

    // Read all ref information from the library
    const refData: any = {};

    const nodeRefsData = result?.ONAPI_REFS || {};
    for (const key in nodeRefsData) {
      const data = nodeRefsData[key];
      if (!isString(data?.ref)) {
        continue;
      }
      const dataModel: any = getModelItem(data?.ref);

      const overrideData = data?.ONAPI_OVERRIDES ?? {};
      if (parentModels?.includes(dataModel?.model_id)) {
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      const newData: any = await parseModelToJsonSchema(
        dataModel?.schema || {},
        [...parentModels, dataModel?.model_id],
      );
      newData.properties = merge(newData.properties || {}, overrideData);

      // Re-sort
      if (isArray(newData?.ONAPI_ORDERS) && newData.ONAPI_ORDERS.length > 0) {
        const newProperties = [];
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

    //
    if (isArray(result?.ONAPI_ORDERS) && result.ONAPI_ORDERS.length > 0) {
      const newProperties = [];
      let requireds = isArray(result?.required) ? result.required : [];
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

    // Recursively parse internal elements
    for (const modelKey in result.properties) {
      const modelData = result.properties[modelKey];
      // eslint-disable-next-line no-await-in-loop
      result.properties[modelKey] = await parseModelToJsonSchema(
        modelData,
        parentModels,
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

  return { parseModelToJsonSchema };
}

export default dataModels;
