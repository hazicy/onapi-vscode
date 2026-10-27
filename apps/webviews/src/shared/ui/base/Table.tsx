import tableStyles from "./Table.module.css";
import React, { useMemo, useState } from "react";
import {
  useTable,
  tableFeatures,
  rowSortingFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  createSortedRowModel,
  createPaginatedRowModel,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type PaginationState,
} from "@tanstack/react-table";
import { get } from "lodash-es";
import cx from "classnames";
import { Checkbox } from "./Checkbox";
import { Button } from "./Button";
import type { TableProps, TableColumnType } from "./types";
import { useThemeConfig } from "./Theme";

const features = tableFeatures({
  columnVisibilityFeature,
  rowSortingFeature,
  rowSelectionFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});
const SELECTION_COLUMN = { key: "__selection__" };
const EMPTY_ROWS: never[] = [];
const EMPTY_COLUMNS: never[] = [];

export function Table<T extends object = Record<string, unknown>>({
  borderedClassName,
  cellClassName,

  dataSource = EMPTY_ROWS,
  columns = EMPTY_COLUMNS,
  rowKey = "key",
  rowSelection,
  pagination = false,
  loading,
  onChange,
  className,
  rootClassName,
  locale,
  tableLayout,
  bordered,
  style,
  components = {},
  scroll,
  onRow,
  rowClassName,
  showHeader = true,
  ...props
}: TableProps<T>) {
  const theme = useThemeConfig().components?.Table;
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<RowSelectionState>(() =>
    Object.fromEntries(
      (rowSelection?.defaultSelectedRowKeys ?? []).map((key) => [
        String(key),
        true,
      ]),
    ),
  );
  const [page, setPage] = useState<PaginationState>({
    pageIndex: pagination ? (pagination.defaultCurrent ?? 1) - 1 : 0,
    pageSize: pagination ? (pagination.defaultPageSize ?? 10) : 10,
  });
  const getKey = (record: T, index: number) =>
    typeof rowKey === "function" ? rowKey(record, index) : get(record, rowKey);
  const selection: RowSelectionState = rowSelection?.selectedRowKeys
    ? Object.fromEntries(
        rowSelection.selectedRowKeys.map((key) => [String(key), true as const]),
      )
    : selected;
  const pageState = {
    pageIndex: pagination
      ? pagination.current
        ? pagination.current - 1
        : page.pageIndex
      : 0,
    pageSize: pagination
      ? (pagination.pageSize ?? page.pageSize)
      : Math.max(1, dataSource.length),
  };
  const definitions = useMemo(() => {
    const convert = (
      items: TableColumnType<T>[],
    ): ColumnDef<typeof features, T>[] =>
      items.map((col, index) => ({
        id: String(
          col.key ??
            (Array.isArray(col.dataIndex)
              ? col.dataIndex.join(".")
              : col.dataIndex) ??
            index,
        ),
        accessorFn: (record) =>
          col.dataIndex === undefined ? undefined : get(record, col.dataIndex),
        enableSorting: !!col.sorter,
        sortDescFirst: false,
        sortFn:
          typeof col.sorter === "function"
            ? (a, b) => col.sorter(a.original, b.original)
            : (a, b, id) =>
                String(a.getValue(id) ?? "").localeCompare(
                  String(b.getValue(id) ?? ""),
                  undefined,
                  { numeric: true },
                ),
        columns: col.children ? convert(col.children) : undefined,
        meta: { source: col },
      }));
    const list = [...columns];
    if (rowSelection && !list.some((col) => col.key === SELECTION_COLUMN.key)) {
      list.unshift(SELECTION_COLUMN);
    }
    return convert(list);
  }, [columns, !!rowSelection]);
  const notifySelection = (next: RowSelectionState, type: string) => {
    setSelected(next);
    const rows = dataSource.filter(
      (record, index) => next[String(getKey(record, index))],
    );
    const keys = Object.keys(next)
      .filter((key) => next[key])
      .map((key) => {
        const index = dataSource.findIndex(
          (record, i) => String(getKey(record, i)) === key,
        );
        return index < 0 ? key : getKey(dataSource[index], index);
      });
    rowSelection?.onChange?.(keys, rows, { type });
    return rows;
  };
  const table = useTable({
    features,
    columns: definitions,
    data: dataSource,
    getRowId: (record, index) => String(getKey(record, index)),
    state: { sorting, rowSelection: selection, pagination: pageState },
    enableMultiSort: false,
    enableMultiRowSelection: rowSelection?.type !== "radio",
    enableRowSelection: (row) =>
      !rowSelection?.getCheckboxProps?.(row.original)?.disabled,
    autoResetPageIndex: false,
    manualPagination: !!pagination && pagination.total !== undefined,
    rowCount: pagination ? pagination.total : undefined,
    onSortingChange: (update) => {
      const next = typeof update === "function" ? update(sorting) : update;
      setSorting(next);
      const sort = next[0];
      const col = columns.find(
        (column) => String(column.key ?? column.dataIndex) === sort?.id,
      );
      onChange?.(
        pagination,
        {},
        sort
          ? {
              ...col,
              order: sort.desc ? "descend" : "ascend",
              columnKey: sort.id,
            }
          : {},
        { action: "sort", currentDataSource: dataSource },
      );
    },
    onRowSelectionChange: (update) =>
      notifySelection(
        typeof update === "function" ? update(selection) : update,
        "multiple",
      ),
    onPaginationChange: (update) => {
      const next = typeof update === "function" ? update(pageState) : update;
      setPage(next);
      if (pagination) {
        pagination.onChange?.(next.pageIndex + 1, next.pageSize);
        if (next.pageSize !== pageState.pageSize) {
          pagination.onShowSizeChange?.(next.pageIndex + 1, next.pageSize);
        }
      }
      onChange?.(
        { ...pagination, current: next.pageIndex + 1, pageSize: next.pageSize },
        {},
        {},
        { action: "paginate", currentDataSource: dataSource },
      );
    },
  });
  const leaves = table.getVisibleLeafColumns();
  const source = (column: (typeof leaves)[number]): TableColumnType<T> =>
    (column.columnDef.meta as { source: TableColumnType<T> }).source;
  const fixedStyle = (column: (typeof leaves)[number]): React.CSSProperties => {
    const col = source(column);
    if (!col.fixed) {
      return {};
    }
    const side = col.fixed === "right" ? "right" : "left";
    const index = leaves.indexOf(column);
    const others =
      side === "left" ? leaves.slice(0, index) : leaves.slice(index + 1);
    const offset = others
      .filter(
        (item) =>
          source(item).fixed &&
          (source(item).fixed === "right" ? "right" : "left") === side,
      )
      .reduce((sum, item) => sum + (Number(source(item).width) || 36), 0);
    return {
      position: "sticky",
      [side]: offset,
      zIndex: 1,
      background: "var(--color-bg-page, var(--vscode-editor-background))",
    };
  };
  const total =
    pagination && pagination.total !== undefined
      ? pagination.total
      : dataSource.length;
  const rows = table.getRowModel().rows;
  const BodyRow = components.body?.row ?? "tr";
  const BodyCell = components.body?.cell ?? "td";
  const HeaderCell = components.header?.cell ?? "th";
  const HeaderRow = components.header?.row ?? "tr";
  const Body = components.body?.wrapper ?? "tbody";
  const Header = components.header?.wrapper ?? "thead";
  return (
    <div
      className={cx(
        tableStyles.table,
        bordered && cx(tableStyles.bordered, borderedClassName),
        className,
        rootClassName,
      )}
      aria-busy={!!loading}
      style={
        {
          "--ui-table-header-bg": theme?.headerBg,
          "--ui-table-padding":
            typeof theme?.padding === "number"
              ? `${theme.padding}px`
              : theme?.padding,
          ...style,
        } as React.CSSProperties
      }
    >
      {loading && <div role="status">Loading…</div>}
      <div
        className={tableStyles.table}
        style={{ overflow: "auto", maxHeight: scroll?.y }}
      >
        <table style={{ tableLayout, minWidth: scroll?.x || undefined }}>
          <colgroup>
            {leaves.map((column) => (
              <col
                key={column.id}
                style={{
                  width:
                    source(column).width ??
                    (column.id === SELECTION_COLUMN.key
                      ? (rowSelection?.columnWidth ?? 36)
                      : undefined),
                }}
              />
            ))}
          </colgroup>
          {showHeader && (
            <Header
              style={
                scroll?.y
                  ? { position: "sticky", top: 0, zIndex: 2 }
                  : undefined
              }
            >
              {table.getHeaderGroups().map((group) => (
                <HeaderRow key={group.id}>
                  {group.headers.map((header) => {
                    const col = source(header.column);
                    const title =
                      typeof col.title === "function"
                        ? col.title({ sortColumns: sorting })
                        : col.title;
                    const cellProps = col.onHeaderCell?.(col) ?? {};
                    return (
                      <HeaderCell
                        {...cellProps}
                        key={header.id}
                        colSpan={header.colSpan}
                        className={cx(
                          col.className,
                          cellClassName,
                          cellProps.className,
                        )}
                        style={{
                          ...fixedStyle(header.column),
                          ...cellProps.style,
                        }}
                        aria-sort={
                          header.column.getCanSort()
                            ? header.column.getIsSorted() === "asc"
                              ? "ascending"
                              : header.column.getIsSorted() === "desc"
                                ? "descending"
                                : "none"
                            : undefined
                        }
                      >
                        {header.isPlaceholder ? null : header.column.id ===
                          SELECTION_COLUMN.key ? (
                          rowSelection?.hideSelectAll ||
                          rowSelection?.type === "radio" ? (
                            rowSelection.columnTitle
                          ) : (
                            (rowSelection?.columnTitle ?? (
                              <Checkbox
                                aria-label="Select all rows"
                                checked={table.getIsAllRowsSelected()}
                                indeterminate={
                                  !table.getIsAllRowsSelected() &&
                                  table.getIsSomeRowsSelected()
                                }
                                onChange={(event) => {
                                  table.toggleAllRowsSelected(
                                    event.target.checked,
                                  );
                                  const eligible = table
                                    .getPrePaginatedRowModel()
                                    .rows.filter((row) => row.getCanSelect());
                                  const next = { ...selection };
                                  eligible.forEach((row) => {
                                    if (event.target.checked) {
                                      next[row.id] = true;
                                    } else {
                                      delete next[row.id];
                                    }
                                  });
                                  rowSelection?.onSelectAll?.(
                                    event.target.checked,
                                    dataSource.filter(
                                      (record, index) =>
                                        next[String(getKey(record, index))],
                                    ),
                                    eligible
                                      .filter(
                                        (row) =>
                                          !!selection[row.id] !==
                                          event.target.checked,
                                      )
                                      .map((row) => row.original),
                                  );
                                }}
                              />
                            ))
                          )
                        ) : header.column.getCanSort() ? (
                          <button
                            type="button"
                            className={tableStyles.sortHeader}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {title} ↕
                          </button>
                        ) : (
                          title
                        )}
                      </HeaderCell>
                    );
                  })}
                </HeaderRow>
              ))}
            </Header>
          )}
          <Body>
            {rows.map((row, index) => {
              const record = row.original;
              const rowProps = onRow?.(record, index) ?? {};
              return (
                <BodyRow
                  {...rowProps}
                  key={row.id}
                  data-row-key={getKey(record, row.index)}
                  className={cx(
                    rowClassName,
                    typeof rowClassName === "function"
                      ? rowClassName(record, index)
                      : rowClassName,
                    rowProps.className,
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const col = source(cell.column);
                    const cellProps = col.onCell?.(record, index) ?? {};
                    if (cellProps.colSpan === 0 || cellProps.rowSpan === 0) {
                      return null;
                    }
                    let content: React.ReactNode;
                    if (cell.column.id === SELECTION_COLUMN.key) {
                      const checkbox = (
                        <Checkbox
                          {...rowSelection?.getCheckboxProps?.(record)}
                          checked={row.getIsSelected()}
                          onChange={(event) => {
                            const next =
                              rowSelection?.type === "radio"
                                ? {}
                                : { ...selection };
                            if (event.target.checked) {
                              next[row.id] = true;
                            } else {
                              delete next[row.id];
                            }
                            const selectedRows = notifySelection(
                              next,
                              "single",
                            );
                            rowSelection?.onSelect?.(
                              record,
                              event.target.checked,
                              selectedRows,
                            );
                          }}
                        />
                      );
                      content =
                        rowSelection?.renderCell?.(
                          row.getIsSelected(),
                          record,
                          index,
                          checkbox,
                        ) ?? checkbox;
                    } else {
                      content = col.render
                        ? col.render(cell.getValue(), record, index)
                        : (cell.getValue() as React.ReactNode);
                    }
                    return (
                      <BodyCell
                        {...cellProps}
                        key={col.key ?? cell.column.id}
                        className={cx(
                          cellClassName,
                          col.className,
                          cellProps.className,
                        )}
                        style={{
                          textAlign: col.align,
                          ...fixedStyle(cell.column),
                          ...cellProps.style,
                        }}
                      >
                        {content}
                      </BodyCell>
                    );
                  })}
                </BodyRow>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={Math.max(1, leaves.length)}>
                  {locale?.emptyText ?? "No data"}
                </td>
              </tr>
            )}
          </Body>
        </table>
      </div>
      {pagination && (
        <nav aria-label="Pagination" className={tableStyles.actions}>
          {pagination.showTotal?.(total, [
            pageState.pageIndex * pageState.pageSize + 1,
            Math.min((pageState.pageIndex + 1) * pageState.pageSize, total),
          ])}
          {pagination.showSizeChanger && (
            <label>
              Page size
              <select
                aria-label="Page size"
                value={pageState.pageSize}
                onChange={(event) =>
                  table.setPagination({
                    pageIndex: 0,
                    pageSize: Number(event.target.value),
                  })
                }
              >
                {(pagination.pageSizeOptions ?? [10, 20, 50, 100]).map(
                  (size: number | string) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ),
                )}
              </select>
            </label>
          )}
          <Button
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            Previous
          </Button>
          <span>
            {pageState.pageIndex + 1} /{" "}
            {Math.max(1, Math.ceil(total / pageState.pageSize))}
          </span>
          <Button
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  );
}
Table.SELECTION_COLUMN = SELECTION_COLUMN;
