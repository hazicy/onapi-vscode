import styles from "../Table.module.css";
import { Table as BaseTable } from "@/shared/ui/base";

import { DndContext } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cloneDeep, head, last, map } from "lodash-es";

import ResizableTable from "../ResizableTable";
import { SORT_KEY } from "../constants";
import { AnyObject } from "../types";
import { BasicTableProps, ColumnsType } from "../types";
import DragEnableRow from "./DragEnableRow";

const DragTable = <DataSource extends AnyObject>(
  props: BasicTableProps<DataSource>,
) => {
  const {
    onDragEnd,
    dataSource,
    columns,
    rowKey,
    dragFirstDisabled = false,
    dragLastDisabled = false,
    resizableColEnable = false,
  } = props;

  const nextColumns = cloneDeep(columns) as ColumnsType<DataSource>[];

  // Place the selection column after the handle column;
  if (props.rowSelection) {
    nextColumns?.unshift(BaseTable.SELECTION_COLUMN);
  }

  // When draggable, add handle column
  nextColumns?.unshift({
    key: SORT_KEY,
    className: styles.sortHandle,
    width: 30,
  });

  const tableProps = { ...props, columns: nextColumns };
  const firstKey = dragFirstDisabled ? head(dataSource)?.[rowKey as any] : "";
  const lastKey = dragLastDisabled ? last(dataSource)?.[rowKey as any] : "";

  const initialOnDragEnd = (props: DragEndEvent) => {
    if (
      dragFirstDisabled &&
      (props?.over?.id === firstKey || props?.active?.id === firstKey)
    ) {
      return;
    }
    if (
      dragLastDisabled &&
      (props?.over?.id === lastKey || props?.active?.id === lastKey)
    ) {
      return;
    }

    if (onDragEnd) {
      onDragEnd(props);
    }
  };

  let RenderTable = BaseTable;

  if (resizableColEnable) {
    RenderTable = ResizableTable as any;
  }

  return (
    <div className={styles.container}>
      <div className={styles.table}>
        <DndContext onDragEnd={initialOnDragEnd}>
          <SortableContext
            items={map(dataSource, (item) => {
              return item[rowKey as string];
            })}
            strategy={verticalListSortingStrategy}
          >
            <RenderTable<DataSource>
              {...tableProps}
              components={{
                body: {
                  row: DragEnableRow,
                },
              }}
            />
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

export default DragTable;
