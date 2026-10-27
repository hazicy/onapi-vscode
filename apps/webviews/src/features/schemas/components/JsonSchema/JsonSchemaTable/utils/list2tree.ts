import { isArray, isUndefined } from "lodash-es";

export const listToTree = (data?: any[]) => {
  const treeData: any = {};
  const rootData: any = [];
  if (!Array.isArray(data)) {
    return;
  }
  data.forEach((item) => {
    treeData[item.model_id] = {
      key: item?.model_id,
      title: item?.display_name || item?.name || "",
      model_type: item.model_type,
    };
  });
  for (const item of data) {
    const nodeItem = treeData[item.model_id];
    const parent = treeData[item?.parentId];
    if (isUndefined(parent)) {
      rootData.push(nodeItem);
      continue;
    }
    if (!isArray(parent?.children)) {
      parent.children = [];
    }
    parent?.children?.push(nodeItem);
  }
  return rootData;
};
