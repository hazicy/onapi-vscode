import styles from "../Tree.module.css";
import { FC, ReactNode, memo, useMemo } from "react";

import { Dropdown, MenuProps } from "@/shared/ui/base";

import { isNumber } from "lodash-es";

import { TreeDataItem } from "@onapi/http-model/requests/types/api";

type Props = Partial<
  TreeDataItem & {
    showChildrenCount?: boolean;
    scrollIng?: boolean;
    childrenCount?: number;
    nodeItemTitleExtraContent: (item: Props) => ReactNode;
    nodeItemDropdownContextMenu: (item: Props) => MenuProps;
  }
>;

const ItemTitle: FC<Props> = memo((props) => {
  const {
    name,
    showChildrenCount,
    nodeItemTitleExtraContent,
    nodeItemDropdownContextMenu,
    scrollIng,
    childrenCount,
  } = props;

  const dropdownContextMenu = useMemo(
    () => (!scrollIng ? nodeItemDropdownContextMenu?.(props) : undefined),
    [nodeItemDropdownContextMenu, props, scrollIng],
  );

  const extraContent = useMemo(
    () =>
      nodeItemTitleExtraContent?.({
        ...props,
        moreOperateMenu: dropdownContextMenu,
      }),
    [nodeItemTitleExtraContent, props, dropdownContextMenu],
  );

  const renderContent = (
    <div className={styles.itemTitle}>
      <div className={styles.title} title={name}>
        {name}
        {showChildrenCount && isNumber(childrenCount) && childrenCount > 0 && (
          <span className={styles.childrenNum}>({childrenCount})</span>
        )}
      </div>
      {extraContent}
    </div>
  );

  if (props?.scrollIng) {
    return renderContent;
  }

  if (!dropdownContextMenu) {
    return renderContent;
  }

  return (
    <Dropdown trigger={["contextMenu"]} menu={dropdownContextMenu}>
      {renderContent}
    </Dropdown>
  );
});

export default ItemTitle;
