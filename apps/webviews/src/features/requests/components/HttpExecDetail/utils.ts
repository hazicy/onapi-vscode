import { AnyObject } from "@onapi/http-model/types/common";

export const formatObjectToArrayKeyValue = (obj: AnyObject) => {
  const list = [];
  const reqHeader = obj || {};

  for (const key in reqHeader) {
    if (typeof reqHeader[key] === "object") {
      for (const it in reqHeader[key]) {
        list.push({ key, value: reqHeader[key][it] });
      }
    } else {
      list.push({ key, value: reqHeader[key] });
    }
  }
  return list;
};
