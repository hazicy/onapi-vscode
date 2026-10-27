import { MouseEvent, useEffect, useMemo } from "react";
import type { ResizeCallbackData } from "react-resizable";
import { Resizable } from "react-resizable";

import { Table as BaseTable, TableColumnsType } from "@/shared/ui/base";

import { useMemoizedFn, useSafeState } from "ahooks";
import { produce } from "immer";
import { map } from "lodash";

import { AnyObject, BasicTableProps } from "./types";
import { SORT_KEY } from "./constants";

const ResizableTitle = (
  props: React.HTMLAttributes<any> & {
    onResize: (
      e: React.SyntheticEvent<Element>,
      data: ResizeCallbackData,
    ) => void;
    width: number;
  },
) => {
  const { onResize, width, ...restProps } = props;

  const handleStopPropagation = (event: MouseEvent<HTMLSpanElement>) => {
    event?.stopPropagation();
  };

  if (!width) {
    return <th {...restProps} />;
  }

  return (
    <Resizable
      width={width}
      height={0}
      maxConstraints={[500, 0]}
      minConstraints={[60, 0]}
      handle={
        <span
          className="react-resizable-handle"
          onClick={handleStopPropagation}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
};

const ResizableTable = <DataSource extends AnyObject>(
  props: BasicTableProps<DataSource>,
) => {
  const { columns } = props;
  const [resizableColumns, setResizableColumns] = useSafeState(columns);

  useEffect(() => {
    const resultColumns = map(columns, (item, index) => ({
      ...item,
      width: resizableColumns?.[index]?.width || item?.width,
    }));

    setResizableColumns(resultColumns);
  }, [columns]);

  const handleResize = useMemoizedFn(
    (index: number) =>
      (_: React.SyntheticEvent<Element>, { size }: ResizeCallbackData) => {
        const newColumns = produce(resizableColumns, (draft) => {
          if (draft?.[index].width) {
            draft[index].width = size.width;
          }
        });

        setResizableColumns(newColumns);
      },
  );

  const mergedColumns = useMemo(
    () =>
      resizableColumns?.map<TableColumnsType<DataSource>[number]>(
        (col, index) => ({
          ...col,
          onHeaderCell: (column: TableColumnsType<DataSource>[number]) => ({
            width: col.key === SORT_KEY ? undefined : column.width,
            onResize: handleResize(index) as React.ReactEventHandler<any>,
            key: column.key,
          }),
        }),
      ),
    [resizableColumns, handleResize],
  );

  const tableProps = { ...props, columns: mergedColumns };

  return (
    <BaseTable<DataSource>
      {...tableProps}
      components={{
        body: tableProps?.components?.body,
        header: {
          cell: ResizableTitle,
        },
      }}
    />
  );
};

export default ResizableTable;
