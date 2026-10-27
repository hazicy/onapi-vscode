import {
  cloneDeep,
  has,
  isArray,
  isEmpty,
  isPlainObject,
  keys,
} from "lodash-es";

const getApiOrders = (node: any) => {
  try {
    const initialOrderKeys = isArray(node?.ONAPI_ORDERS)
      ? node.ONAPI_ORDERS
      : [];
    const properties = isPlainObject(node?.properties) ? node.properties : {};
    const propertiesKeys = keys(properties);
    const orderKeysInfo = propertiesKeys.reduce(
      (pre, e) => {
        if (pre.orderKeys.includes(e) === false) {
          pre.isEqual = false;
          pre.orderKeys.push(e);
        }
        return pre;
      },
      { orderKeys: initialOrderKeys, isEqual: true },
    );
    if (!orderKeysInfo.isEqual) {
      return orderKeysInfo.orderKeys;
    }
    return initialOrderKeys;
  } catch (err) {
    return [];
  }
};

export const recursionSetSchemaOrder = (originSchema: any) => {
  try {
    const schema = cloneDeep(originSchema);
    if (
      has(schema, "properties") &&
      Object.prototype.toString.call(schema?.properties) === "[object Object]"
    ) {
      schema["ONAPI_ORDERS"] = getApiOrders(schema || {});
      schema["properties"] = keys(schema?.properties)?.reduce(
        (pre: any, key) => {
          if (key && !isEmpty(schema?.properties[key])) {
            pre[key] = recursionSetSchemaOrder(schema?.properties[key]);
          }
          return pre;
        },
        {},
      );
    }
    if (schema?.type === "array" && has(schema, "items")) {
      if (
        has(schema?.items, "properties") &&
        Object.prototype.toString.call(schema?.items?.properties) ===
          "[object Object]"
      ) {
        schema.items = recursionSetSchemaOrder(schema?.items);
      }
    }
    return schema;
  } catch (err) {
    return originSchema;
  }
};
