import LineTabs from "@/shared/components/LineTabs/LineTabs";
import { HttpParameterTable } from "@/shared/components/RequestTable/RequestTable";
import RequestAuth from "./Request/Auth/Auth";
import RequestScripts from "./Request/RequestScripts";
import type {
  ItemGroupDefinition,
  VariableDefinition,
} from "postman-collection";

type CollectionSettings = ItemGroupDefinition & {
  variable?: VariableDefinition[];
};
export default function RequestGlobal<T extends CollectionSettings>(props: {
  item: T;
  onItemChange: (item: T) => void;
  defaultTabKey?: string;
}) {
  const { item, onItemChange: change, defaultTabKey } = props;
  return (
    <LineTabs
      defaultActiveKey={
        defaultTabKey === "Headers" ? "Params" : defaultTabKey || "Params"
      }
      items={[
        {
          key: "Params",
          label: "Variables",
          children: (
            <HttpParameterTable
              tabType="query"
              dataSource={item.variable || []}
              onChange={(variable) => change({ ...item, variable })}
            />
          ),
        },
        {
          key: "Auth",
          label: "Auth",
          children: (
            <RequestAuth
              value={item.auth}
              onChange={(_, auth) => change({ ...item, auth })}
            />
          ),
        },
        ...["prerequest", "test"].map((listen, index) => ({
          key: index ? "postResponse" : "preRequest",
          label: index ? "Post-response" : "Pre-request",
          children: (
            <RequestScripts
              listen={listen}
              events={item.event || []}
              onChange={(event) => change({ ...item, event })}
            />
          ),
        })),
      ]}
    />
  );
}
