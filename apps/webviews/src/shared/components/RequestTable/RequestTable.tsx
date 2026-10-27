import { STATUS_CODE } from "@onapi/http-model/constants/common";
import { RowKey, RowValue, RowContentType } from "./components";
import Listen from "./components/Listen";
import {
  sdkParameterToRow,
  rowToSdkParameter,
  type SdkParameter,
  type EditedSdkParameter,
} from "./sdk";
import Context from "./context";
import styles from "./RequestTable.module.css";
import { FC, memo, useMemo, useRef } from "react";

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMemoizedFn } from "ahooks";

import { snowflakeId } from "@onapi/http-model/utils/data-tools";
import { produce } from "immer";
import { cloneDeep } from "lodash-es";

import KeyValueRow from "./components/KeyValueRow";
import { PARAMETER_ITEM } from "@onapi/http-model/requests/constants/request";
import { ApisBaseDataItem } from "@onapi/http-model/requests/types/base";

import { RequestTableProps } from "./types";

import PublicParamsTable from "./components/PublicParamsTable";

const RequestTable: FC<RequestTableProps & { fileValue?: "path" | "base64" }> =
  memo(
    ({
      fileValue = "base64",
      dataSource = [],
      globalParams = [],
      folderParams = [],
      onChange,
      paramsType,
      tabType,
      readOnly,
      bodyMode,
      showAiDescription = true,
      isSystem = false,
      columnSwitchConfig,
      showDelete = true,
      kind,
    }) => {
      const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, {
          coordinateGetter: sortableKeyboardCoordinates,
        }),
      );
      const lastRowDataRef = useRef<ApisBaseDataItem | null>(null);

      const tableDataList = useMemo(() => {
        if (dataSource.some((row) => row.static) || readOnly) {
          return dataSource;
        }
        if (
          !lastRowDataRef.current ||
          dataSource.some(
            (row) => row.param_id === lastRowDataRef.current?.param_id,
          )
        ) {
          lastRowDataRef.current = {
            ...PARAMETER_ITEM,
            param_id: snowflakeId(),
          };
        }
        return [...dataSource, lastRowDataRef.current];
      }, [dataSource, readOnly]);

      const handleItemOnChange = useMemoizedFn(
        (rowIndex: number, rowData: ApisBaseDataItem) => {
          const newDataSource = produce(
            dataSource,
            (draft: ApisBaseDataItem[]) => {
              draft[rowIndex] = rowData;

              // Key and value must not be empty, and not in read-only mode, to allow adding new rows
              if ((rowData?.key || rowData?.value) && !readOnly) {
                delete draft[rowIndex].static;
              }
            },
          );

          onChange?.(newDataSource);
        },
      );

      const onDelete = useMemoizedFn((rowIndex: number) => {
        const newDataSource = produce(
          dataSource,
          (draft: ApisBaseDataItem[]) => {
            draft.splice(rowIndex, 1);
          },
        );

        onChange?.(newDataSource);
      });

      const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (over && active.id !== over.id) {
          const _dataSource = cloneDeep(dataSource);
          const activeIndex = _dataSource.findIndex(
            (i) => i.param_id === active.id,
          );
          const overIndex = _dataSource.findIndex(
            (i) => i.param_id === over?.id,
          );
          if (activeIndex < 0 || overIndex < 0) {
            return;
          }
          const newDataSource = arrayMove(_dataSource, activeIndex, overIndex);

          onChange?.(newDataSource);
        }
      };
      return (
        <Context.Provider value={{ fileValue }}>
          <div className={styles.requestTable}>
            <PublicParamsTable
              kind={kind}
              tabType={tabType}
              isSystem={isSystem}
              paramsType={paramsType}
              globalParams={globalParams}
              folderParams={folderParams}
              columnSwitchConfig={columnSwitchConfig}
            />
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={tableDataList.map(
                  (row, index) => row.param_id ?? `row-${index}`,
                )}
                strategy={verticalListSortingStrategy}
              >
                {tableDataList.map((row, index) => (
                  <KeyValueRow
                    key={row.param_id ?? `row-${index}`}
                    id={row.param_id ?? `row-${index}`}
                    readOnly={readOnly}
                    showCheckbox={tabType !== "socketio"}
                    checked={row.is_checked === STATUS_CODE.ENABLE}
                    checkboxDisabled={!!row.static}
                    draggable={!!row.param_id}
                    showDelete={showDelete}
                    placeholderRow={index >= dataSource.length || !!row.static}
                    onCheckedChange={(checked) =>
                      handleItemOnChange(index, {
                        ...row,
                        is_checked: checked
                          ? STATUS_CODE.ENABLE
                          : STATUS_CODE.DISABLE,
                      })
                    }
                    onDelete={() => onDelete(index)}
                    keyEditor={
                      <RowKey
                        rowData={row}
                        rowIndex={index}
                        tabType={tabType}
                        bodyMode={bodyMode}
                        readOnly={readOnly}
                        onChange={handleItemOnChange}
                        showCheckbox={false}
                        showFieldType={bodyMode === "form-data"}
                        showAiDescription={showAiDescription}
                      />
                    }
                    valueEditor={
                      tabType === "event" ? undefined : tabType ===
                        "socketio" ? (
                        <Listen
                          rowData={row}
                          rowIndex={index}
                          readOnly={readOnly}
                          onChange={handleItemOnChange}
                        />
                      ) : (
                        <RowValue
                          rowData={row}
                          rowIndex={index}
                          tabType={tabType}
                          bodyMode={bodyMode}
                          readOnly={readOnly}
                          onChange={handleItemOnChange}
                          valueSuffix
                        />
                      )
                    }
                    extraFields={
                      bodyMode === "form-data" ? (
                        <RowContentType
                          rowData={row}
                          rowIndex={index}
                          readOnly={readOnly}
                          onChange={handleItemOnChange}
                        />
                      ) : undefined
                    }
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </Context.Provider>
      );
    },
  );

export type HttpParameterTableProps = Omit<
  RequestTableProps,
  "dataSource" | "onChange"
> & {
  dataSource: SdkParameter[];
  onChange: (rows: EditedSdkParameter[]) => void;
};

export function HttpParameterTable(props: HttpParameterTableProps) {
  const identities = useRef(new WeakMap<SdkParameter, string>());
  const { dataSource, onChange, ...rest } = props;
  const rows = dataSource.map((parameter) => {
    let id = parameter.id || identities.current.get(parameter);
    if (!id) {
      id = snowflakeId();
      identities.current.set(parameter, id);
    }
    return sdkParameterToRow(parameter, id);
  });
  const originals = new Map(
    rows.map((row, index) => [row.param_id, dataSource[index]]),
  );
  return (
    <RequestTable
      {...rest}
      fileValue="path"
      dataSource={rows}
      onChange={(next) =>
        onChange(
          next.map((row) =>
            rowToSdkParameter(
              row,
              originals.get(row.param_id),
              props.bodyMode === "form-data",
            ),
          ),
        )
      }
    />
  );
}
export default RequestTable;
