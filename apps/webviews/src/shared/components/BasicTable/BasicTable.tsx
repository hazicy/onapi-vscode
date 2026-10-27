import { useMemo } from "react";

import { ConfigProvider } from "@/shared/ui/base";

import classNames from "classnames";

import Empty from "@/shared/ui/Empty";
import useTheme from "@/shared/hooks/useTheme";

import DragTable from "./DragTable/DragTable";
import Table from "./Table";
import { getTheme } from "./theme";
import { AnyObject, BasicTableProps } from "./types";

const BasicTable = <DataSource extends AnyObject>(
  props: BasicTableProps<DataSource>,
) => {
  const { themeToken } = useTheme();

  const theme = useMemo(
    () => getTheme(themeToken, { cellPadding: props.cellPadding }),
    [themeToken, props.cellPadding],
  );

  const { dragEnable } = props;

  const tableProps = {
    ...props,
    rowClassName: classNames(props.rootClassName, {}),
    pagination: props.pagination ?? false,
    locale: { emptyText: <Empty style={{ height: 160 }} /> },
  };

  return (
    <ConfigProvider theme={theme}>
      {dragEnable ? (
        <DragTable<DataSource> {...tableProps} />
      ) : (
        <Table<DataSource> {...tableProps} />
      )}
    </ConfigProvider>
  );
};

export default BasicTable;
