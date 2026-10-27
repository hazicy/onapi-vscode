import React from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import AppIcon from "@/shared/ui/AppIcon";

interface DragEnableRow extends React.HTMLAttributes<HTMLTableRowElement> {
  "data-row-key": string;
}
const DragEnableRow = ({ children, ...props }: DragEnableRow) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props["data-row-key"],
  });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
    transition,
    ...(isDragging ? { position: "relative", zIndex: 999 } : {}),
  };

  return (
    <tr {...props} ref={setNodeRef} style={style} {...attributes} role="row">
      {React.Children.map(children, (child) => {
        if ((child as React.ReactElement).key === "sort") {
          return React.cloneElement(
            child as React.ReactElement<{ children?: React.ReactNode }>,
            {
              children: (
                <AppIcon
                  icon="grip-vertical"
                  ref={setActivatorNodeRef}
                  style={{ touchAction: "none", cursor: "move", fontSize: 10 }}
                  {...listeners}
                />
              ),
            },
          );
        }
        return child;
      })}
    </tr>
  );
};

export default DragEnableRow;
