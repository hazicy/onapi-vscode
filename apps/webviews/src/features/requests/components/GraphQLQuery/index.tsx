import { useMemoizedFn } from "ahooks";
import type {
  GraphQLChangeFuncType,
  GraphQLDetailsData,
} from "@onapi/http-model/requests/types/graphql";
import GraphQLQueryContext from "./context/GraphQLQueryContext";
import Main from "./Main";

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
    (body: import("@onapi/http-model").HttpRequestBody) =>
      onChange("request", { ...requestData, body }),
  );
  return (
    <GraphQLQueryContext.Provider value={{ apiData, onChange }}>
      <Main data={{ ...requestData.body, mode: "graphql" }} onChange={update} />
    </GraphQLQueryContext.Provider>
  );
}
