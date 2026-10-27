import { useMemo } from "react";

import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useMemoizedFn } from "ahooks";
import { snowflakeId } from "@onapi/http-model/utils/data-tools";
import { produce } from "immer";
import { cloneDeep, isArray } from "lodash-es";

interface Props {
  // Data source
  dataSource: any[];
  // Default row data
  defaultRowDataItem: any;
  // Whether to add static row condition
  addStaticCondition: (rowData: any) => boolean;
  // change event
  onChange: (params: any[]) => void;
}

const useEditTable = (props: Props) => {
  const { dataSource, defaultRowDataItem, addStaticCondition, onChange } =
    props;

  const tableDataList = useMemo(() => {
    if (!isArray(dataSource)) {
      return [{ ...defaultRowDataItem, param_id: snowflakeId() }];
    }
    const hasStaticRow = dataSource?.some((item) => !!item?.static);
    if (!hasStaticRow) {
      return [
        ...dataSource,
        { ...defaultRowDataItem, param_id: snowflakeId() },
      ];
    }
    return dataSource;
  }, [dataSource]);

  const handleChangeRowItem = useMemoizedFn(
    (rowData: any, rowIndex: number) => {
      const newData = produce(dataSource, (draft) => {
        draft[rowIndex] = rowData;

        if (addStaticCondition(rowData)) {
          delete draft[rowIndex].static;
        }
      });
      onChange(newData);
    },
  );

  const handleDeleteRow = useMemoizedFn((rowIndex: number) => {
    const newDataSource = produce(dataSource, (draft) => {
      draft.splice(rowIndex, 1);
    });

    onChange(newDataSource);
  });

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      const _dataSource = cloneDeep(dataSource);
      const activeIndex = _dataSource.findIndex(
        (i) => i.param_id === active.id,
      );
      const overIndex = _dataSource.findIndex((i) => i.param_id === over?.id);
      const newDataSource = arrayMove(_dataSource, activeIndex, overIndex);

      onChange?.(newDataSource);
    }
  };

  return {
    tableDataList,
    handleChangeRowItem,
    handleDeleteRow,
    handleDragEnd,
  };
};

export default useEditTable;
