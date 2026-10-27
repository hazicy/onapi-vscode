import { useMemoizedFn } from "ahooks";
import type {
  GraphQLChangeFuncType,
  GraphQLDetailsData,
} from "@onapi/domain/requests/types/graphql";
import GraphQLQueryContext from "./context/GraphQLQueryContext";
import GraphQLQueryEditor from "./GraphQLQueryEditor";

interface Props {
  requestData: GraphQLDetailsData["request"];
  apiData: GraphQLDetailsData;
  id: string;
  onChange: GraphQLChangeFuncType<GraphQLDetailsData>;
}

export default function GraphQLQuery({
  requestData,
  apiData,
  onChange,
}: Props) {
  const update = useMemoizedFn(
    (body: import("@onapi/domain").HttpRequestBody) =>
      onChange("request", { ...requestData, body }),
  );
  return (
    <GraphQLQueryContext.Provider value={{ apiData, onChange }}>
      <GraphQLQueryEditor
        data={{ ...requestData.body, mode: "graphql" }}
        onChange={update}
      />
    </GraphQLQueryContext.Provider>
  );
}
