import { HttpParameterTable } from "@/shared/components/RequestTable/RequestTable";
import type { RequestBodyProps } from "../types";
import useTableColumnSwitchConfig from "@/features/settings/hooks/useTableColumnSwitchConfig";

export default function FormData(props: RequestBodyProps) {
  const { columnSwitchConfig, onColumnSwitchConfig } =
    useTableColumnSwitchConfig("request_body_column_switch");
  return (
    <HttpParameterTable
      tabType="body"
      bodyMode="form-data"
      dataSource={props.value?.formdata || []}
      onChange={(rows) =>
        props.onChange("body", {
          ...props.value,
          mode: "formdata",
          formdata: rows,
        })
      }
      columnSwitchConfig={columnSwitchConfig}
      onColumnSwitchConfig={onColumnSwitchConfig}
    />
  );
}
