/**
 * Whether to expand by default
 */
export const getDefaultActiveKey = ({
  isDefaultActiveKeyShowAll,
  isDefaultActiveItems,
  type,
}: {
  isDefaultActiveKeyShowAll: boolean;
  isDefaultActiveItems: string[];
  type: string;
}) => {
  let defaultActiveKey = undefined;
  if (isDefaultActiveItems && Array.isArray(isDefaultActiveItems)) {
    if (isDefaultActiveItems.includes(type)) {
      defaultActiveKey = "0";
    }
  }
  if (isDefaultActiveKeyShowAll) {
    defaultActiveKey = "0";
  }

  return defaultActiveKey;
};
