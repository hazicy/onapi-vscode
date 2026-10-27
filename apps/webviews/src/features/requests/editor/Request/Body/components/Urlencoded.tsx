import { HttpParameterTable } from "@/shared/components/RequestTable/RequestTable";
import type { RequestBodyProps } from "../types";
import useTableColumnSwitchConfig from "@/features/settings/hooks/useTableColumnSwitchConfig";

export default function Urlencoded(props: RequestBodyProps) {
  const { columnSwitchConfig, onColumnSwitchConfig } =
    useTableColumnSwitchConfig("request_body_column_switch");
  return (
    <HttpParameterTable
      tabType="body"
      bodyMode="urlencoded"
      dataSource={props.value?.urlencoded || []}
      onChange={(rows) =>
        props.onChange("body", {
          ...props.value,
          mode: "urlencoded",
          urlencoded: rows.map((row) => ({
            ...row,
            key: row.key ?? "",
            value: row.value ?? null,
          })),
        })
      }
      columnSwitchConfig={columnSwitchConfig}
      onColumnSwitchConfig={onColumnSwitchConfig}
    />
  );
}
