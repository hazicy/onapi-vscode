import styles from "./ListSideBar.module.css";

import { Button, Flex } from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import clsx from "clsx";
import { isEqual, map, size } from "lodash-es";

import { AppIcon } from "@/shared/ui";

import InputEdit from "./InputEdit";

interface Props {
  handleSelect: (p: string) => void;
  value: { name: string; param_id: string }[];
  activeId: string | undefined;
  handleEdit: (
    i: number,
    { key, value }: { key: string; value: string },
  ) => void;
  handleAdd: () => void;
  handleRemove: (p: string) => void;
  addText?: string;
}

const ListSideBar = (props: Props) => {
  const [expand, setExpand] = useSafeState<boolean>(false);
  const {
    value,
    activeId,
    handleSelect,
    handleEdit,
    handleAdd,
    handleRemove,
    addText,
  } = props;

  return (
    <Flex className={styles.container}>
      <Flex
        vertical
        className={clsx(styles.sideTreeWrap, {
          [styles.expand]: expand,
        })}
      >
        <div className={styles.basicTabsCon}>
          <ul>
            {map(value, (item, index) => {
              return (
                <InputEdit
                  key={item.param_id}
                  active={isEqual(item.param_id, activeId)}
                  label={item.name}
                  curKey={item.param_id}
                  canDelete={size(value) > 1}
                  onSelect={handleSelect}
                  onEdit={(v) => handleEdit(index, v)}
                  onRemove={handleRemove}
                />
              );
            })}
          </ul>
        </div>
        <div className={styles.addBtnCon}>
          <Button
            onClick={handleAdd}
            icon={<AppIcon icon="plus" className={styles.icon} />}
            type="dashed"
            size="small"
            block
          >
            {addText || "New Query"}
          </Button>
        </div>
      </Flex>
      <div className={styles.expandDivider}>
        <div className={styles.iconWrap} onClick={() => setExpand(!expand)}>
          <AppIcon
            icon="chevron-down"
            rotate={expand ? -90 : 90}
            className={styles.icon}
          />
        </div>
      </div>
    </Flex>
  );
};

export default ListSideBar;
