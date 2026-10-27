import { DragEndEvent } from "@dnd-kit/core";

export interface DraggableMenuProps {
  items: DraggableMenuItemType[];
  selectedKeys?: string[];
  className?: string;
  style?: React.CSSProperties;
  onDragEnd?: (event: DragEndEvent) => void;
  onSelect?: (keys: DraggableMenuProps["selectedKeys"]) => void;
}

export type DraggableMenuItemType = {
  label: React.ReactNode;
  key: React.Key;
  icon?: React.ReactNode;
  children?: DraggableMenuItemType[];
  type?: string | undefined;
  disableDraggable?: boolean;
};

export type GroupProps = {
  title: React.ReactNode;
  children: React.ReactNode;
};

export type ItemProps = {
  id: React.Key;
  children: React.ReactNode;
  icon?: React.ReactNode;
  disableDraggable?: boolean;
  selectedKeys?: string[];
  onItemClick?: (id: string) => void;
};
