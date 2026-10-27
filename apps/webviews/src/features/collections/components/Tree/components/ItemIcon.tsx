import { memo } from "react";

import PrefixIcon from "@/shared/ui/PrefixIcon";
import { TreeDataItem } from "@onapi/domain/requests/types/api";

const ItemIcon = memo((props: TreeDataItem & Record<string, any>) => {
  const { method, type } = props;

  return <PrefixIcon type={props[type]} method={method} />;
});

export default ItemIcon;
