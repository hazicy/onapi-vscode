import clsx from "clsx";
import styles from "./NodeList.module.css";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import AppIcon from "@/shared/ui/AppIcon";

import ItemNode from "../ItemNode/ItemNode";

export const SortableItem = ({ index, nodeProps }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    setActivatorNodeRef,
  } = useSortable({
    id: nodeProps.nodeKey,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const DragHandle = (click: any) => (
    <div className={styles.container}>
      <AppIcon
        className={styles.dragIcon}
        onMouseDown={click}
        icon="grip-vertical"
        ref={setActivatorNodeRef}
        style={{
          touchAction: "none",
          cursor: "move",
          fontSize: 10,
          width: "20px",
          justifyContent: "center",
        }}
        {...listeners}
      />
    </div>
  );
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ItemNode DragHandle={DragHandle} key={index} {...nodeProps} />
    </div>
  );
};

export const SortableList = ({ listData, nodeProps, onDragEnd }: any) => {
  const { requiredKeys, ...restProps } = nodeProps;
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      sensors={sensors}
    >
      <div>
        <SortableContext
          strategy={verticalListSortingStrategy}
          items={listData?.map(([itemKey]: any) => itemKey)}
        >
          {listData.map(([itemKey, item]: any, index: number) => (
            <SortableItem
              key={index}
              nodeProps={{
                value: item,
                nodeKey: itemKey,
                isRequired: requiredKeys.includes(itemKey),
                ...restProps,
              }}
              index={index}
            />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
};
