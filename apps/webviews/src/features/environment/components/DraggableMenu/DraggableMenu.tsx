import styles from "./DraggableMenu.module.css";
import { FC } from "react";

import { DndContext, PointerSensor, useSensor } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import cn from "classnames";
import { includes, map } from "lodash";

import { AppIcon } from "@/shared/ui";

import { DraggableMenuProps, GroupProps, ItemProps } from "./types";

const Item: FC<ItemProps> = ({
  id,
  children,
  icon,
  disableDraggable,
  selectedKeys,
  onItemClick,
}) => {
  const {
    setNodeRef,
    listeners,
    transform,
    transition,
    attributes,
    setActivatorNodeRef,
  } = useSortable({ id: `${id}` });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={styles.draggableMenuItem}
    >
      <div
        className={cn(styles.draggableMenuItem, {
          [styles.draggableMenuItemSelected]: includes(selectedKeys, id),
        })}
        onClick={() => onItemClick?.(`${id}`)}
      >
        {!disableDraggable && (
          <AppIcon
            icon="grip-vertical"
            className={styles.iconDrag}
            ref={setActivatorNodeRef}
            style={{ touchAction: "none", cursor: "move", fontSize: 10 }}
            {...listeners}
          />
        )}
        <span className="draggable-menu-item-icon">{icon}</span>
        <div className={styles.draggableMenuTitleContent}>{children}</div>
      </div>
    </li>
  );
};

const Group: FC<GroupProps> = ({ title, children }) => {
  return (
    <li className={styles.draggableMenuGroup}>
      <div className={styles.draggableMenuItemGroupTitle}>{title}</div>
      <ul className="draggable-menu-item-group-list">{children}</ul>
    </li>
  );
};

const DraggableMenu: FC<DraggableMenuProps> = ({
  className,
  style,
  items,
  onDragEnd,
  selectedKeys,
  onSelect,
}) => {
  const sensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 10 },
  });

  return (
    <ul style={style} className={cn(styles.container, className)}>
      <DndContext sensors={[sensor]} onDragEnd={onDragEnd}>
        {map(items, (menuItem) =>
          menuItem?.type === "group" ? (
            <Group key={menuItem.key} title={menuItem.label}>
              <SortableContext
                items={map(menuItem.children, (i) => `${i?.key}`)}
                strategy={verticalListSortingStrategy}
                disabled={menuItem.disableDraggable}
              >
                {map(menuItem.children, (child) => (
                  <Item
                    key={`${child?.key}`}
                    id={`${child?.key}`}
                    icon={child?.icon}
                    disableDraggable={menuItem?.disableDraggable}
                    selectedKeys={selectedKeys}
                    onItemClick={(id) => onSelect?.([id])}
                  >
                    {child?.label}
                  </Item>
                ))}
              </SortableContext>
            </Group>
          ) : (
            <SortableContext
              items={map(items, (i) => `${i?.key}`)}
              strategy={verticalListSortingStrategy}
            >
              <Item
                key={menuItem.key}
                id={menuItem.key}
                icon={menuItem.icon}
                selectedKeys={selectedKeys}
                onItemClick={(id) => onSelect?.([id])}
              >
                {menuItem.label}
              </Item>
            </SortableContext>
          ),
        )}
      </DndContext>
    </ul>
  );
};

export default DraggableMenu;
